import {assert, test} from "vitest";
import {valueExtent} from "./value-extent.ts";

test("spans the lowest and highest value", () => {
  const records = [{v: 3}, {v: -1}, {v: 7}];

  assert.deepEqual(valueExtent(records), {min: -1, max: 7});
});

test("has no extent without records", () => {
  assert.isUndefined(valueExtent([]));
});
