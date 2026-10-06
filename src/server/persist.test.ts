import fs from "node:fs";
import path from "node:path";
import {describe, expect, vi} from "vitest";

import {createBuffer} from "./buffer.ts";
import * as persist from "./persist.ts";
import {feedRecord} from "./test-helpers/feed-record.ts";
import {test} from "./test-helpers/signal-listeners.ts";

const NOW = 1_789_211_900;

test.override({now: NOW * 1000});

// An existing snapshot keeps keep() from restoring the committed seed.
function withEmptySnapshot(dir: string) {
  fs.writeFileSync(path.join(dir, "buffer.json"), "{}");
}

describe("save and load", () => {
  test("writes the buffer to the file as JSON keyed by channel", async ({dir}) => {
    const buffer = createBuffer();
    buffer.add({
      k: 237,
      v: 23.26,
      cv: "23.26",
      t: NOW - 7,
      s: 24,
      sid: 1_789_211_888_321,
    });
    const file = path.join(dir, "buffer.json");

    await persist.save(buffer, file);

    expect(JSON.parse(fs.readFileSync(file, "utf8"))).to.deep.equal({
      237: [{k: 237, v: 23.26, cv: "23.26", t: NOW - 7, s: 24, sid: 1_789_211_888_321}],
    });
  });

  test("replaces the file rather than writing into it", async ({dir}) => {
    const file = path.join(dir, "buffer.json");
    fs.writeFileSync(file, "{}");
    const replaced = fs.statSync(file).ino;

    await persist.save(createBuffer(), file);

    expect(fs.statSync(file).ino).to.not.equal(replaced);
  });

  test("leaves STATUS out of the file", async ({dir}) => {
    const buffer = createBuffer();
    buffer.add({k: 297, v: 1, t: NOW - 5, s: 24, sid: (NOW - 5) * 1000});
    buffer.add(feedRecord({v: 1, t: NOW - 5, s: 24}));
    const file = path.join(dir, "buffer.json");

    await persist.save(buffer, file);

    expect(JSON.parse(fs.readFileSync(file, "utf8"))).to.have.all.keys("237");
  });

  test("loads into a fresh buffer the records it saved", async ({dir}) => {
    const saved = createBuffer();
    saved.add(feedRecord({v: 1, t: NOW - 20, s: 24}));
    saved.add(feedRecord({v: 2, t: NOW - 10, s: 24}));
    const file = path.join(dir, "buffer.json");
    await persist.save(saved, file);
    const loaded = createBuffer();

    const log = vi.spyOn(console, "log").mockReturnValue(undefined);
    persist.load(loaded, file);
    log.mockRestore();

    expect(loaded.backfill(237).map((r) => [r.v, r.t])).to.deep.equal([
      [1, NOW - 20],
      [2, NOW - 10],
    ]);
  });

  test.for([
    // eslint-disable-next-line unicorn/no-null -- FeedRecord carries Lightstreamer's null for an absent CalibratedData
    ["value", {k: 237, v: NaN, cv: null, t: NOW - 10, s: 24, sid: 1_789_211_888_321}],
    ["time", {k: 237, v: 1, cv: "1", t: NaN, s: 24, sid: 1_789_211_888_321}],
  ] as const)(
    "loads a record whose %s is not a number as it was saved",
    async ([, record], {dir}) => {
      const saved = createBuffer();
      saved.add(record);
      const file = path.join(dir, "buffer.json");
      await persist.save(saved, file);
      const loaded = createBuffer();

      const log = vi.spyOn(console, "log").mockReturnValue(undefined);
      persist.load(loaded, file);
      log.mockRestore();

      expect(loaded.backfill(237)).to.deep.equal([record]);
    },
  );

  test("leaves the buffer empty and logs one line when there is no file", ({dir}) => {
    const buffer = createBuffer();

    const log = vi.spyOn(console, "log").mockReturnValue(undefined);
    persist.load(buffer, path.join(dir, "buffer.json"));

    expect([buffer.backfill(237), log.mock.calls.length]).to.deep.equal([[], 1]);
  });

  test("leaves the buffer empty and reports one error when the file is truncated", ({
    dir,
  }) => {
    const file = path.join(dir, "buffer.json");
    fs.writeFileSync(file, '{"237": [{"k": 237, "v": 1, "t": 1789211890, "s"');
    const buffer = createBuffer();

    const error = vi.spyOn(console, "error").mockReturnValue(undefined);
    persist.load(buffer, file);

    expect([buffer.backfill(237), error.mock.calls.length]).to.deep.equal([[], 1]);
  });

  test("answers that an empty file exists and reports one error", ({dir}) => {
    const file = path.join(dir, "buffer.json");
    fs.writeFileSync(file, "");

    const error = vi.spyOn(console, "error").mockReturnValue(undefined);
    const exists = persist.load(createBuffer(), file);

    expect([exists, error.mock.calls.length]).to.deep.equal([true, 1]);
  });

  test("throws when the file exists but cannot be read", ({dir}) => {
    const file = path.join(dir, "buffer.json");
    fs.mkdirSync(file);

    expect(() => persist.load(createBuffer(), file))
      .to.throw(Error)
      .with.property("code", "EISDIR");
  });
});

describe("keep", () => {
  test.for([
    ["not a number", NaN],
    ["beyond the longest timer delay", 2_147_484],
  ] as const)("rejects a period that is %s", ([, seconds], {dir}) => {
    const log = vi.spyOn(console, "log").mockReturnValue(undefined);
    expect(() => {
      persist.keep(createBuffer(), dir, seconds);
    }).to.throw(RangeError);
    log.mockRestore();
  });

  test("restores the 137 carried channels of the committed seed into a data directory with no snapshot", ({
    dir,
  }) => {
    const buffer = createBuffer();

    const log = vi.spyOn(console, "log").mockReturnValue(undefined);
    persist.keep(buffer, dir, 1);
    log.mockRestore();

    expect(Object.keys(buffer.snapshot())).to.have.lengthOf(137);
  });

  test("starts no periodic save while the last is still writing", ({dir}) => {
    withEmptySnapshot(dir);
    const writes = vi.spyOn(fs.promises, "writeFile").mockImplementation(
      () =>
        new Promise(() => {
          // Never settles: the save stays in flight.
        }),
    );
    const log = vi.spyOn(console, "log").mockReturnValue(undefined);
    persist.keep(createBuffer(), dir, 1);
    log.mockRestore();

    vi.advanceTimersByTime(1000);
    vi.advanceTimersByTime(1000);

    expect(writes.mock.calls.length).to.equal(1);
  });

  test("logs a failed periodic save", async ({dir}) => {
    withEmptySnapshot(dir);
    const failure = new Error("EIO: i/o error, write");
    vi.spyOn(fs.promises, "writeFile").mockImplementation(() => Promise.reject(failure));
    const {promise: logged, resolve} = Promise.withResolvers<unknown[]>();
    vi.spyOn(console, "error").mockImplementation((...line: unknown[]) => {
      resolve(line);
    });
    const log = vi.spyOn(console, "log").mockReturnValue(undefined);
    persist.keep(createBuffer(), dir, 1);
    log.mockRestore();

    vi.advanceTimersByTime(1000);

    expect(await logged).to.deep.equal(["buffer snapshot failed:", failure]);
  });

  test("saves again a period after a failed save", async ({dir}) => {
    withEmptySnapshot(dir);
    const writes = vi
      .spyOn(fs.promises, "writeFile")
      .mockImplementation(() => Promise.reject(new Error("EIO: i/o error, write")));
    const {promise: logged, resolve} = Promise.withResolvers<unknown[]>();
    vi.spyOn(console, "error").mockImplementation((...line: unknown[]) => {
      resolve(line);
    });
    const log = vi.spyOn(console, "log").mockReturnValue(undefined);
    persist.keep(createBuffer(), dir, 1);
    log.mockRestore();

    vi.advanceTimersByTime(1000);
    await logged;
    // The failed save schedules the next only after it has logged.
    await new Promise((resolve) => setImmediate(resolve));
    vi.advanceTimersByTime(1000);

    expect(writes.mock.calls.length).to.equal(2);
  });
});
