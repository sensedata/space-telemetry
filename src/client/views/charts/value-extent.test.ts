import {assert, test} from "vitest";
import {timedRecord} from "../../test-helpers/records.ts";
import {valueExtent} from "./value-extent.ts";

test("spans the lowest and highest value", () => {
  const records = [timedRecord({v: 3}), timedRecord({v: -1}), timedRecord({v: 7})];

  assert.deepEqual(valueExtent(records), {min: -1, max: 7});
});

test("leaves out a record without a value", () => {
  const records = [timedRecord({v: undefined}), timedRecord({v: 5}), timedRecord({v: 9})];

  assert.deepEqual(valueExtent(records), {min: 5, max: 9});
});

test("has no extent where no record has a value", () => {
  const records = [timedRecord({v: undefined}), timedRecord({v: undefined})];

  assert.isUndefined(valueExtent(records));
});
