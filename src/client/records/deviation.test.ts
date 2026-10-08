import {assert, describe, test} from "vitest";

import {timedRecord} from "../test-helpers/records.ts";
import {deviation} from "./deviation.ts";

describe("the deviation of channels", () => {
  test("is the largest distance of any channel's value from the mean of them all", () => {
    const deviated = deviation([
      [timedRecord({t: 1, v: 160})],
      [timedRecord({t: 1, v: 160})],
      [timedRecord({t: 1, v: 160})],
      [timedRecord({t: 1, v: 152})],
    ]);

    assert.equal(deviated.at(-1)?.v, 6);
  });

  test("is half the difference of a pair of channels", () => {
    const deviated = deviation([
      [timedRecord({t: 1, v: 160})],
      [timedRecord({t: 1, v: 150})],
    ]);

    assert.equal(deviated.at(-1)?.v, 5);
  });

  test("is nothing for a lone reporting channel", () => {
    const deviated = deviation([[timedRecord({t: 1, v: 160})], []]);

    assert.equal(deviated.at(-1)?.v, 0);
  });

  test("marks the deviation of the channels' means", () => {
    const deviated = deviation([
      [timedRecord({t: 1, v: 160, vm: 158})],
      [timedRecord({t: 1, v: 150, vm: 154})],
    ]);

    assert.equal(deviated.at(-1)?.vm, 2);
  });
});
