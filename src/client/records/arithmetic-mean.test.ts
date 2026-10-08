import {assert, test} from "vitest";

import {arithmeticMean} from "./arithmetic-mean.ts";

test("the arithmetic mean of values is their sum over their count", () => {
  assert.equal(arithmeticMean([10, 12, 17]), 13);
});
