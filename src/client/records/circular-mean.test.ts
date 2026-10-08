import {assert, describe, test} from "vitest";

import {circularMean} from "./circular-mean.ts";

describe("the circular mean of angles", () => {
  test("is the arithmetic mean of angles short of half a turn apart", () => {
    assert.closeTo(circularMean([10, 30]), 20, 1e-9);
  });

  test("is the direction between angles either side of the turn from 360 to 0", () => {
    assert.closeTo(circularMean([350, 10]), 0, 1e-9);
  });

  test("is the direction between angles either side of the turn from 180 to -180", () => {
    assert.closeTo(circularMean([170, -150]), -170, 1e-9);
  });
});
