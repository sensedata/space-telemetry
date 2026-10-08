import {assert, describe, test} from "vitest";

import {timedRecord} from "../test-helpers/records.ts";
import {combineByTime} from "./combine-by-time.ts";

function reporting(newest: readonly unknown[]) {
  return {v: newest.filter((record) => record !== undefined).length, vm: 0};
}

describe("records combined by time", () => {
  test("hold one record per time any channel reported", () => {
    const combined = combineByTime(
      [
        [timedRecord({t: 1, v: 1})],
        [timedRecord({t: 1, v: 2}), timedRecord({t: 3, v: 3})],
      ],
      reporting,
    );

    assert.deepEqual(
      combined.map((record) => record.t),
      [1, 3],
    );
  });

  test("count a channel as reporting from its first record on", () => {
    const combined = combineByTime(
      [[timedRecord({t: 1, v: 1})], [timedRecord({t: 2, v: 2})]],
      reporting,
    );

    assert.deepEqual(
      combined.map((record) => record.v),
      [1, 2],
    );
  });

  test("hand combine each channel's newest record as of the time", () => {
    const combined = combineByTime(
      [
        [timedRecord({t: 1, v: 1}), timedRecord({t: 3, v: 3})],
        [timedRecord({t: 2, v: 2})],
      ],
      (newest) => ({
        v: newest.reduce((total, record) => total + (record?.v ?? 0), 0),
        vm: 0,
      }),
    );

    assert.deepEqual(
      combined.map((record) => record.v),
      [1, 3, 5],
    );
  });

  test("leave out a record without a value", () => {
    const combined = combineByTime(
      [[timedRecord({t: 1, v: 1}), timedRecord({t: 2, v: undefined})]],
      reporting,
    );

    assert.deepEqual(
      combined.map((record) => record.t),
      [1],
    );
  });

  test("hold no record for a time whose channels combine to no reading", () => {
    const combined = combineByTime(
      [[timedRecord({t: 1, v: 1})], [timedRecord({t: 2, v: 2})]],
      (newest) =>
        newest.every((record) => record !== undefined) ? {v: 1, vm: 0} : undefined,
    );

    assert.deepEqual(
      combined.map((record) => record.t),
      [2],
    );
  });

  test("hold the newest 150 times, in numeric order", () => {
    const combined = combineByTime(
      [Array.from({length: 200}, (_, t) => timedRecord({t, v: 1}))],
      reporting,
    );

    assert.deepEqual(
      combined.map((record) => record.t),
      Array.from({length: 150}, (_, n) => n + 50),
    );
  });
});
