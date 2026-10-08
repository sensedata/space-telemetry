import {assert, describe, test} from "vitest";

import {timedRecord} from "../test-helpers/records.ts";
import {mergeRecords} from "./merge-records.ts";

describe("a channel's records once an event's arrive", () => {
  test("are in ascending order by time", () => {
    const merged = mergeRecords(
      [timedRecord({t: 1})],
      [timedRecord({t: 0}), timedRecord({t: 2})],
    );

    assert.deepEqual(
      merged.map((record) => record.t),
      [0, 1, 2],
    );
  });

  test("hold a record once though a reconnect's backfill resends it", () => {
    const merged = mergeRecords(
      [timedRecord({t: 1, v: 5, s: 24}), timedRecord({t: 2, v: 6, s: 24})],
      [timedRecord({t: 2, v: 6, s: 24})],
    );

    assert.deepEqual(merged, [
      timedRecord({t: 1, v: 5, s: 24}),
      timedRecord({t: 2, v: 6, s: 24}),
    ]);
  });

  test("keep an arrival that differs from a held record only in status, after it", () => {
    const merged = mergeRecords(
      [timedRecord({t: 1, v: 5, s: 24})],
      [timedRecord({t: 1, v: 5, s: 0})],
    );

    assert.deepEqual(merged, [
      timedRecord({t: 1, v: 5, s: 24}),
      timedRecord({t: 1, v: 5, s: 0}),
    ]);
  });

  test("keep an arrival that differs from a held record only in value, after it", () => {
    const merged = mergeRecords(
      [timedRecord({t: 100, v: 1})],
      [timedRecord({t: 100, v: 0})],
    );

    assert.deepEqual(merged, [timedRecord({t: 100, v: 1}), timedRecord({t: 100, v: 0})]);
  });

  test("are the newest 150", () => {
    const merged = mergeRecords(
      [],
      Array.from({length: 200}, (_, t) => timedRecord({t})),
    );

    assert.deepEqual([merged.length, merged[0]?.t, merged.at(-1)?.t], [150, 50, 199]);
  });
});
