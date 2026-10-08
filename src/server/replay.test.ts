import {expect, vi} from "vitest";

import type {FeedRecord} from "./feed-record.ts";
import {play} from "./replay.ts";
import {collectingSource} from "./test-helpers/collecting-source.ts";
import {test} from "./test-helpers/fake-clock.ts";

// The channels `records` holds after each of the advances of the clock in `stepsMs`.
function channelsAfterEach(records: readonly FeedRecord[], stepsMs: readonly number[]) {
  const channels: string[][] = [];
  for (const ms of stepsMs) {
    vi.advanceTimersByTime(ms);
    channels.push(records.map((record) => record.k));
  }
  return channels;
}

test("emits rows at the recorded cadence divided by the rate", () => {
  const {source, records} = collectingSource();
  void play(
    [
      {k: "AIRLOCK000002", v: 1, cv: "1", t: 1000, s: 24, sid: 7},
      {k: "AIRLOCK000003", v: 2, cv: "2", t: 1001, s: 24, sid: 7},
      {k: "AIRLOCK000004", v: 3, cv: "3", t: 1003, s: 24, sid: 7},
    ],
    {rate: 4, rebase: false},
    source,
  );

  expect(channelsAfterEach(records, [249, 1, 499, 1])).to.deep.equal([
    ["AIRLOCK000002"],
    ["AIRLOCK000002", "AIRLOCK000003"],
    ["AIRLOCK000002", "AIRLOCK000003"],
    ["AIRLOCK000002", "AIRLOCK000003", "AIRLOCK000004"],
  ]);
});

test("never emits recorded STATUS rows", () => {
  const {source, records} = collectingSource();

  void play(
    [
      {k: "AIRLOCK000002", v: 1, cv: "1", t: 1000, s: 24, sid: 7},
      // eslint-disable-next-line unicorn/no-null -- FeedRecord carries Lightstreamer's null for an absent CalibratedData
      {k: "STATUS", v: 0, cv: null, t: 1000, s: 2, sid: 1_000_000},
      {k: "AIRLOCK000003", v: 2, cv: "2", t: 1000, s: 24, sid: 7},
    ],
    {rate: 1, rebase: false},
    source,
  );

  expect(records.map((record) => record.k)).to.deep.equal([
    "AIRLOCK000002",
    "AIRLOCK000003",
  ]);
});

test("with rebase, stamps each record with the wall-clock second it falls due", () => {
  vi.setSystemTime(Date.parse("2026-09-26T12:00:00.250Z"));
  const {source, records} = collectingSource();
  void play(
    [
      {k: "AIRLOCK000002", v: 1, cv: "1", t: 1000, s: 24, sid: 7},
      {k: "AIRLOCK000003", v: 2, cv: "2", t: 1020, s: 24, sid: 7},
    ],
    {rate: 10, rebase: true},
    source,
  );

  vi.advanceTimersByTime(2000);

  expect(records.map((record) => record.t)).to.deep.equal([1_790_424_000, 1_790_424_002]);
});

test("resolves only after emitting the last row", async () => {
  const {source, records} = collectingSource();
  const done = play(
    [
      {k: "AIRLOCK000002", v: 1, cv: "1", t: 1000, s: 24, sid: 7},
      {k: "AIRLOCK000003", v: 2, cv: "2", t: 1010, s: 24, sid: 7},
    ],
    {rate: 1, rebase: false},
    source,
  );
  // eslint-disable-next-line unicorn/prefer-await -- the callback reads records.length when play resolves, while the test goes on to advance the clock
  const emittedWhenResolved = done.then(() => records.length);

  // The microtask this yields lets a premature resolution run its callback before the
  // clock reaches the last row.
  await Promise.resolve();
  vi.advanceTimersByTime(10_000);

  expect(await emittedWhenResolved).to.equal(2);
});
