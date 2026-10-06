import {assert, test} from "vitest";
import {timedRecord} from "../../test-helpers/records.ts";
import {withRightPoint} from "./with-right-point.ts";

test("carries the newest record forward to now when it is more than 2 seconds old", () => {
  const records = [timedRecord({t: 90, v: 0}), timedRecord({t: 100, v: 1})];

  assert.deepEqual(withRightPoint(records, 103), [
    timedRecord({t: 90, v: 0}),
    timedRecord({t: 100, v: 1}),
    timedRecord({t: 103, v: 1}),
  ]);
});

test("ends the window at a newest record 2 seconds old", () => {
  const records = [timedRecord({t: 90, v: 0}), timedRecord({t: 100, v: 1})];

  assert.deepEqual(withRightPoint(records, 102), [
    timedRecord({t: 90, v: 0}),
    timedRecord({t: 100, v: 1}),
  ]);
});

test("gives no points for no records", () => {
  assert.deepEqual(withRightPoint([], 103), []);
});
