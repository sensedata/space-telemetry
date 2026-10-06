import {assert, test} from "vitest";
import {timedRecord} from "../../test-helpers/records.ts";
import {valueBounds} from "./value-bounds.ts";

test("spans the lowest and highest value", () => {
  const records = [timedRecord({v: 3}), timedRecord({v: -1}), timedRecord({v: 7})];

  assert.deepEqual(valueBounds(records), {min: -1, max: 7});
});

test("counts a record without a value as 0", () => {
  const records = [timedRecord({v: undefined}), timedRecord({v: 5})];

  assert.deepEqual(valueBounds(records), {min: 0, max: 5});
});
