import {assert, describe, test} from "vitest";

import {timedRecord} from "../test-helpers/records.ts";
import {sum} from "./sum.ts";

describe("the sum of channels", () => {
  test("adds the channels' values", () => {
    const summed = sum([[timedRecord({t: 1, v: 1})], [timedRecord({t: 1, v: 3})]]);

    assert.equal(summed[0]?.v, 4);
  });

  test("adds the channels' means", () => {
    const summed = sum([
      [timedRecord({t: 1, v: 1, vm: 10})],
      [timedRecord({t: 1, v: 3, vm: 30})],
    ]);

    assert.equal(summed[0]?.vm, 40);
  });

  test("adds each channel's newest value as of each time", () => {
    const summed = sum([
      [timedRecord({t: 1, v: 1}), timedRecord({t: 2, v: 2})],
      [timedRecord({t: 1, v: 3})],
    ]);

    assert.deepEqual(
      summed.map((record) => record.v),
      [4, 5],
    );
  });

  test("adds the channels reporting as of a time before the rest report", () => {
    const summed = sum([
      [timedRecord({t: 1, v: 1}), timedRecord({t: 2, v: 2})],
      [timedRecord({t: 2, v: 3})],
    ]);

    assert.deepEqual(
      summed.map((record) => record.v),
      [1, 5],
    );
  });

  test("leaves a record without a value out of the sum", () => {
    const summed = sum([
      [timedRecord({t: 1, v: 1}), timedRecord({t: 2, v: undefined})],
      [timedRecord({t: 2, v: 3})],
    ]);

    assert.deepEqual(
      summed.map((record) => record.v),
      [1, 4],
    );
  });

  test("holds no record while no channel has reported", () => {
    assert.deepEqual(sum([[], []]), []);
  });
});
