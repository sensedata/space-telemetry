import {assert, describe, test} from "vitest";

import {timedRecord} from "../test-helpers/records.ts";
import {angleDeviation} from "./angle-deviation.ts";

const plain = {negated: false, turned: false};

describe("the deviation of angles", () => {
  test("is the largest distance of any angle from the mean of them all", () => {
    const deviated = angleDeviation(
      [[timedRecord({t: 1, v: 10})], [timedRecord({t: 1, v: 30})]],
      [plain, plain],
    );

    assert.closeTo(deviated.at(-1)?.v ?? NaN, 10, 1e-9);
  });

  test("measures across the turn from 360 back to 0", () => {
    const deviated = angleDeviation(
      [[timedRecord({t: 1, v: 359})], [timedRecord({t: 1, v: 1})]],
      [plain, plain],
    );

    assert.closeTo(deviated.at(-1)?.v ?? NaN, 1, 1e-9);
  });

  test("is nothing among mirrored mountings turned alike", () => {
    const deviated = angleDeviation(
      [
        [timedRecord({t: 1, v: 20})],
        [timedRecord({t: 1, v: 340})],
        [timedRecord({t: 1, v: 160})],
        [timedRecord({t: 1, v: 200})],
      ],
      [
        {negated: false, turned: false},
        {negated: true, turned: false},
        {negated: true, turned: true},
        {negated: false, turned: true},
      ],
    );

    assert.closeTo(deviated.at(-1)?.v ?? NaN, 0, 1e-9);
  });

  test("finds the one mirrored mounting turned apart from the rest", () => {
    const deviated = angleDeviation(
      [
        [timedRecord({t: 1, v: 20})],
        [timedRecord({t: 1, v: 340})],
        [timedRecord({t: 1, v: 160})],
        [timedRecord({t: 1, v: 240})],
      ],
      [
        {negated: false, turned: false},
        {negated: true, turned: false},
        {negated: true, turned: true},
        {negated: false, turned: true},
      ],
    );

    assert.closeTo(deviated.at(-1)?.v ?? NaN, 30.31, 0.01);
  });

  test("marks the mean of the deviations held", () => {
    const deviated = angleDeviation(
      [
        [timedRecord({t: 1, v: 10})],
        [timedRecord({t: 1, v: 10}), timedRecord({t: 2, v: 12})],
      ],
      [plain, plain],
    );

    assert.closeTo(deviated.at(-1)?.vm ?? NaN, 0.5, 1e-9);
  });
});
