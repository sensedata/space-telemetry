import {describe, expect, vi} from "vitest";

import {createBuffer, type RecordBuffer} from "./buffer.ts";
import type {FeedRecord} from "./feed-record.ts";
import {type CapturedRow, capturedRows} from "./test-helpers/captured-rows.ts";
import {test} from "./test-helpers/fake-clock.ts";

const NOW = 1_789_211_900;

// A captured row as the Lightstreamer adapter emits it, at `t` or else its recorded second.
function record(row: CapturedRow | undefined, t?: number): FeedRecord {
  if (row === undefined) {
    throw new RangeError("the capture holds no such row");
  }
  return {
    k: row.idx,
    v: Number(row.value),
    cv: row.value_calibrated,
    t: t ?? Date.parse(row.ts) / 1000,
    s: row.status,
    sid: row.session_id,
  };
}

// A snapshot as it is saved and read back.
function throughJson(snapshot: unknown): unknown {
  // eslint-disable-next-line unicorn/prefer-structured-clone -- the JSON round trip is the case, not a copy: structuredClone keeps what JSON text loses
  return JSON.parse(JSON.stringify(snapshot));
}

function times(records: readonly FeedRecord[]) {
  return records.map((r) => r.t);
}

// Adds each of `rows` at `t`, or else at its recorded second.
function addEach(buffer: RecordBuffer, rows: readonly CapturedRow[], t?: number) {
  for (const row of rows) buffer.add(record(row, t));
}

// Adds `row` once for each second from `start` up to but not including `end`.
function addEachSecond(
  buffer: RecordBuffer,
  row: CapturedRow | undefined,
  start: number,
  end: number,
) {
  for (let t = start; t < end; t++) buffer.add(record(row, t));
}

test.override({now: NOW * 1000});

describe("backfill", () => {
  test("returns the records of the last 450 seconds in ascending time order", () => {
    const [first, second, third] = capturedRows("USLAB000059");
    const buffer = createBuffer();
    buffer.add(record(third, NOW - 10));
    buffer.add(record(first, NOW - 100));
    buffer.add(record(second, NOW - 50));

    expect(times(buffer.backfill(237))).to.deep.equal([NOW - 100, NOW - 50, NOW - 10]);
  });

  test("leaves out records older than 450 seconds", () => {
    const [first, second, third] = capturedRows("USLAB000059");
    const buffer = createBuffer();
    buffer.add(record(first, NOW - 451));
    buffer.add(record(second, NOW - 450));
    buffer.add(record(third, NOW - 400));

    expect(times(buffer.backfill(237))).to.deep.equal([NOW - 450, NOW - 400]);
  });

  test("returns the single latest record when the last 450 seconds hold none", () => {
    const [first, second] = capturedRows("USLAB000020");
    const buffer = createBuffer();
    buffer.add(record(second, NOW - 900));
    buffer.add(record(first, NOW - 1000));

    expect(buffer.backfill(198).map((r) => [r.t, r.v])).to.deep.equal([
      [NOW - 900, -0.09021296352148056],
    ]);
  });

  test("prefers the higher status class between records of the same second", () => {
    const [, original, resend] = capturedRows("NODE3000009");
    const buffer = createBuffer();
    buffer.add(record(original, NOW - 1000));
    buffer.add(record(resend, NOW - 1000));

    expect(buffer.backfill(75).map((r) => [r.v, r.s])).to.deep.equal([
      [87.87999725341797, 24],
    ]);
  });

  test("keeps the order records were added in between records of the same second", () => {
    const buffer = createBuffer();
    addEach(buffer, capturedRows("USLAB000020"), NOW - 10);

    expect(buffer.backfill(198).map((r) => r.v)).to.deep.equal([
      -0.09021846950054169, -0.09021296352148056, -0.09021422266960144,
    ]);
  });

  test("returns only the records of the channel asked for", () => {
    const buffer = createBuffer();
    buffer.add(record(capturedRows("USLAB000059")[0], NOW - 10));
    buffer.add(record(capturedRows("USLAB000043")[0], NOW - 5));

    expect(buffer.backfill(221).map((r) => [r.k, r.t])).to.deep.equal([[221, NOW - 5]]);
  });

  test("returns nothing for a channel with no records", () => {
    const buffer = createBuffer();

    expect(buffer.backfill(237)).to.deep.equal([]);
  });
});

describe("add", () => {
  test("keeps the 150 most recently added records of a channel", () => {
    const buffer = createBuffer();
    addEachSecond(buffer, capturedRows("USLAB000059")[0], NOW - 151, NOW);

    const kept = buffer.backfill(237);

    expect([kept.length, kept[0]?.t, kept[149]?.t]).to.deep.equal([
      150,
      NOW - 150,
      NOW - 1,
    ]);
  });

  test("drops the oldest record for one beyond 150 added after a backfill", () => {
    const buffer = createBuffer();
    addEachSecond(buffer, capturedRows("USLAB000059")[0], NOW - 150, NOW);
    buffer.backfill(237);

    buffer.add(record(capturedRows("USLAB000059")[0], NOW));

    const kept = buffer.backfill(237);
    expect([kept.length, kept[0]?.t, kept[149]?.t]).to.deep.equal([150, NOW - 149, NOW]);
  });

  test("stores no record of a channel it does not carry", () => {
    const buffer = createBuffer();

    const stored = buffer.add(record(capturedRows("USLAB000085")[0], NOW - 10));

    expect([stored, buffer.backfill(263)]).to.deep.equal([false, []]);
  });

  test.each([
    ["missing", 1],
    ["dead", 2],
    ["off-scale high", 3],
    ["off-scale low", 4],
    ["out of calibration", 7],
    ["flight critical MDM", 12],
    ["lower limit", 16],
  ])("stores no record the feed marks %s", (_meaning, statusClass) => {
    const buffer = createBuffer();
    const reading = record(capturedRows("USLAB000059")[0], NOW - 10);

    const stored = buffer.add({...reading, s: statusClass});

    expect([stored, buffer.backfill(237)]).to.deep.equal([false, []]);
  });

  test("stores no record the feed sends without a status class", () => {
    // Estimated: no captured row has a status class that is not a number.
    const buffer = createBuffer();
    const reading = record(capturedRows("USLAB000059")[0], NOW - 10);

    const stored = buffer.add({...reading, s: NaN});

    expect([stored, buffer.backfill(237)]).to.deep.equal([false, []]);
  });

  test("stores the last good reading the feed resends as static", () => {
    const buffer = createBuffer();
    const reading = record(capturedRows("USLAB000059")[0], NOW - 10);

    buffer.add({...reading, s: 9});

    expect(buffer.backfill(237).map((r) => r.s)).to.deep.equal([9]);
  });

  test("stores the source's own record of a disconnected feed", () => {
    const buffer = createBuffer();

    buffer.add({k: 297, v: 0, t: NOW - 10, s: 2, sid: 1});

    expect(buffer.backfill(297).map((r) => [r.v, r.s])).to.deep.equal([[0, 2]]);
  });

  test("stores no record of the source's own channel without a status class", () => {
    const buffer = createBuffer();

    const stored = buffer.add({k: 297, v: 0, t: NOW - 10, s: NaN, sid: 1});

    expect([stored, buffer.backfill(297)]).to.deep.equal([false, []]);
  });

  test("rejects a record of a channel beyond the data dictionary", () => {
    const buffer = createBuffer();

    expect(() =>
      buffer.add({...record(capturedRows("USLAB000059")[0], NOW - 10), k: 298}),
    ).to.throw(RangeError);
  });

  test("ignores a record identical in value, time and status to one it holds", () => {
    const [resent] = capturedRows("NODE3000009");
    const buffer = createBuffer();
    buffer.add(record(resent, NOW - 10));
    buffer.add(record(resent, NOW - 10));

    expect(times(buffer.backfill(75))).to.deep.equal([NOW - 10]);
  });

  test("reports that it stored a record it did not hold", () => {
    const [resent] = capturedRows("NODE3000009");
    const buffer = createBuffer();

    expect(buffer.add(record(resent, NOW - 10))).to.equal(true);
  });

  test("reports that it ignored a record identical to one it holds", () => {
    const [resent] = capturedRows("NODE3000009");
    const buffer = createBuffer();
    buffer.add(record(resent, NOW - 10));

    expect(buffer.add(record(resent, NOW - 10))).to.equal(false);
  });

  test("keeps records of the same time and status that differ in value", () => {
    const [first, second] = capturedRows("USLAB000020");
    const buffer = createBuffer();
    buffer.add(record(first, NOW - 10));
    buffer.add(record(second, NOW - 10));

    expect(buffer.backfill(198).map((r) => r.v)).to.have.members([
      -0.09021846950054169, -0.09021296352148056,
    ]);
  });

  test("keeps records of the same value and time that differ in status", () => {
    const [first, second] = capturedRows("USLAB000086");
    const buffer = createBuffer();
    buffer.add(record(first, NOW - 10));
    buffer.add(record(second, NOW - 10));

    expect(buffer.backfill(264).map((r) => r.s)).to.have.members([9, 24]);
  });

  test("ignores a repeat of a record whose value is not a number", () => {
    // Estimated: no captured row has a value that is not a number.
    const notANumber = {...record(capturedRows("USLAB000059")[0], NOW - 10), v: NaN};
    const buffer = createBuffer();
    buffer.add(notANumber);
    buffer.add(notANumber);

    expect(times(buffer.backfill(237))).to.deep.equal([NOW - 10]);
  });

  test("ignores a repeat of a record whose time is not a number", () => {
    // Estimated: no captured row has a time that is not a number.
    const notANumber = {...record(capturedRows("USLAB000059")[0], NOW - 10), t: NaN};
    const buffer = createBuffer();
    buffer.add(notANumber);
    buffer.add(notANumber);

    expect(buffer.snapshot()[237]).to.have.lengthOf(1);
  });

  test("keeps a record whose value is a number after one of the same time and status whose value is not", () => {
    const numeric = record(capturedRows("USLAB000059")[0], NOW - 10);
    const buffer = createBuffer();
    // Estimated: no captured row has a value that is not a number.
    buffer.add({...numeric, v: NaN});
    buffer.add(numeric);

    expect(buffer.backfill(237).map((r) => r.v)).to.deep.equal([NaN, 23.26046371459961]);
  });

  test("ignores a record of value -0 repeating one of value 0", () => {
    const zero = record(capturedRows("USLAB000043")[1], NOW - 10);
    const buffer = createBuffer();
    buffer.add(zero);
    // Estimated: no captured row has the value -0.
    buffer.add({...zero, v: -0});

    expect(times(buffer.backfill(221))).to.deep.equal([NOW - 10]);
  });
});

describe("mean", () => {
  test("averages the values the channel holds", () => {
    const buffer = createBuffer();
    addEach(buffer, capturedRows("USLAB000043"));
    buffer.add(record(capturedRows("USLAB000059")[0]));

    expect(buffer.mean(221)).to.equal(6.25);
  });

  test("leaves out values the channel no longer holds", () => {
    const rows = capturedRows("USLAB000043");
    const buffer = createBuffer();
    buffer.add(record(rows[0], NOW - 151));
    addEachSecond(buffer, rows[3], NOW - 150, NOW);

    expect(buffer.mean(221)).to.equal(5);
  });

  test.each([
    ["not a number", NaN],
    ["infinite", Infinity],
  ])("leaves out a value that is %s", (_id, value) => {
    const [first, second, , fourth] = capturedRows("USLAB000043");
    const buffer = createBuffer();
    buffer.add(record(first, NOW - 30));
    // Estimated: no captured row has a value that is not finite.
    buffer.add({...record(second, NOW - 20), v: value});
    buffer.add(record(fourth, NOW - 10));

    expect(buffer.mean(221)).to.equal(7.5);
  });

  test("is 0 when the channel holds no numeric value", () => {
    const buffer = createBuffer();
    // Estimated: no captured row has a value that is not a number.
    buffer.add({...record(capturedRows("USLAB000059")[0], NOW - 10), v: NaN});

    expect(buffer.mean(237)).to.equal(0);
  });
});

describe("snapshot and restore", () => {
  test("restores every record of a channel in the order it was added", () => {
    const [first, second, third] = capturedRows("USLAB000020");
    const buffer = createBuffer();
    buffer.add(record(first, NOW - 10));
    buffer.add(record(second, NOW - 10));
    buffer.add(record(third, NOW - 20));
    buffer.add(record(third, NOW - 10));
    const restored = createBuffer();

    const log = vi.spyOn(console, "log").mockReturnValue(undefined);
    restored.restore(throughJson(buffer.snapshot()));
    log.mockRestore();

    expect(restored.backfill(198).map((r) => [r.t, r.v])).to.deep.equal([
      [NOW - 20, -0.09021422266960144],
      [NOW - 10, -0.09021846950054169],
      [NOW - 10, -0.09021296352148056],
      [NOW - 10, -0.09021422266960144],
    ]);
  });

  test("restores each record with every field it was added with", () => {
    const buffer = createBuffer();
    buffer.add({k: 297, v: 1, t: NOW - 5, s: 24, sid: (NOW - 5) * 1000});
    buffer.add(record(capturedRows("USLAB000086")[0]));
    const restored = createBuffer();

    const log = vi.spyOn(console, "log").mockReturnValue(undefined);
    restored.restore(throughJson(buffer.snapshot()));
    log.mockRestore();

    expect([restored.backfill(297), restored.backfill(264)]).to.deep.equal([
      [{k: 297, v: 1, t: NOW - 5, s: 24, sid: (NOW - 5) * 1000}],
      [{k: 264, v: 53, cv: "", t: 1_768_262_991, s: 9, sid: 1_768_781_287_851}],
    ]);
  });

  test("keeps holding its records when a snapshot it returned is changed", () => {
    const [first, second] = capturedRows("USLAB000059");
    const buffer = createBuffer();
    buffer.add(record(first, NOW - 10));

    const held = buffer.snapshot()[237];
    held?.push(record(second, NOW - 5));

    expect([held?.length, times(buffer.backfill(237))]).to.deep.equal([2, [NOW - 10]]);
  });

  test("replaces the records the buffer held", () => {
    const buffer = createBuffer();
    buffer.add(record(capturedRows("USLAB000043")[0], NOW - 10));

    const log = vi.spyOn(console, "log").mockReturnValue(undefined);
    buffer.restore({237: [record(capturedRows("USLAB000059")[0], NOW - 5)]});
    log.mockRestore();

    expect(buffer.backfill(221)).to.deep.equal([]);
  });

  test("keeps the last 150 records of a channel restored with more", () => {
    const records = Array.from({length: 200}, (_, n) =>
      record(capturedRows("USLAB000059")[0], NOW - 200 + n),
    );
    const buffer = createBuffer();

    const log = vi.spyOn(console, "log").mockReturnValue(undefined);
    buffer.restore({237: records});
    log.mockRestore();

    const kept = buffer.backfill(237);
    expect([kept.length, kept[0]?.t, kept[149]?.t]).to.deep.equal([
      150,
      NOW - 150,
      NOW - 1,
    ]);
  });

  test("restores no record of a channel it does not carry", () => {
    const buffer = createBuffer();

    const log = vi.spyOn(console, "log").mockReturnValue(undefined);
    buffer.restore({
      237: [record(capturedRows("USLAB000059")[0], NOW - 10)],
      263: [record(capturedRows("USLAB000085")[0], NOW - 10)],
    });
    log.mockRestore();

    expect([times(buffer.backfill(237)), buffer.backfill(263)]).to.deep.equal([
      [NOW - 10],
      [],
    ]);
  });

  test("holds nothing after restoring an empty snapshot", () => {
    const buffer = createBuffer();
    buffer.add(record(capturedRows("USLAB000059")[0], NOW - 10));

    const log = vi.spyOn(console, "log").mockReturnValue(undefined);
    buffer.restore({});
    log.mockRestore();

    expect(buffer.backfill(237)).to.deep.equal([]);
  });

  test("logs one line on restore", () => {
    const buffer = createBuffer();

    const log = vi.spyOn(console, "log").mockReturnValue(undefined);
    buffer.restore({237: [record(capturedRows("USLAB000059")[0], NOW - 10)]});

    expect(log.mock.calls.length).to.equal(1);
  });

  const whole = record(capturedRows("USLAB000059")[0], NOW - 5);
  function without(field: keyof FeedRecord) {
    const {[field]: omitted, ...rest} = whole;
    return rest;
  }

  test.each([
    // eslint-disable-next-line unicorn/no-null -- JSON.parse of a saved snapshot can yield null
    ["null", null],
    ["a number", 5],
    ["an array", [[whole]]],
    ["a string", '{"237": []}'],
    ["a channel that is not an array", {237: whole}],
    ["a record that is not an object", {237: [5]}],
    // eslint-disable-next-line unicorn/no-null -- JSON.parse of a saved snapshot can yield null
    ["a record that is null", {237: [null]}],
    ["a record with no channel number", {237: [without("k")]}],
    ["a record with no value", {237: [without("v")]}],
    ["a record with no time", {237: [without("t")]}],
    ["a record with no time after a good one", {237: [whole, without("t")]}],
    ["a record with a text time", {237: [{...whole, t: String(NOW - 5)}]}],
    ["a record with no status class", {237: [without("s")]}],
    ["a record with no session id", {237: [without("sid")]}],
    ["a record with a numeric calibrated value", {237: [{...whole, cv: 23.3}]}],
    ["a channel name that is not a number", {USLAB000059: [whole]}],
    ["a channel number with a leading zero", {"0237": [whole]}],
    ["a channel number beyond 297", {298: [whole]}],
    ["a negative channel number", {"-1": [whole]}],
  ])(
    "keeps what it held and reports one error when the snapshot is %s",
    (_shape, snapshot) => {
      const buffer = createBuffer();
      buffer.add(record(capturedRows("USLAB000059")[1], NOW - 10));

      const error = vi.spyOn(console, "error").mockReturnValue(undefined);
      buffer.restore(snapshot);

      expect([
        buffer.backfill(237).map((r) => r.v),
        error.mock.calls.length,
      ]).to.deep.equal([[23.32332992553711], 1]);
    },
  );
});
