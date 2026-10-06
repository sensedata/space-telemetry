import {assert, test} from "vitest";
import {timedRecord} from "../../test-helpers/records.ts";
import {withLeftPoint} from "./with-left-point.ts";

test("moves the record in force at the window's start to the start", () => {
  const records = [timedRecord({t: 100, v: 1}), timedRecord({t: 110, v: 2})];

  assert.deepEqual(withLeftPoint(records, 105), [
    timedRecord({t: 105, v: 1}),
    timedRecord({t: 110, v: 2}),
  ]);
});

test("takes a record at the window's start as the one in force", () => {
  const records = [timedRecord({t: 105, v: 1}), timedRecord({t: 110, v: 2})];

  assert.deepEqual(withLeftPoint(records, 105), [
    timedRecord({t: 105, v: 1}),
    timedRecord({t: 110, v: 2}),
  ]);
});

test("keeps the records before the one in force", () => {
  const records = [
    timedRecord({t: 90, v: 0}),
    timedRecord({t: 100, v: 1}),
    timedRecord({t: 110, v: 2}),
  ];

  assert.deepEqual(withLeftPoint(records, 105), [
    timedRecord({t: 90, v: 0}),
    timedRecord({t: 105, v: 1}),
    timedRecord({t: 110, v: 2}),
  ]);
});

test("starts the window with a copy of the oldest record when every record is later", () => {
  const records = [timedRecord({t: 110, v: 2}), timedRecord({t: 120, v: 3})];

  assert.deepEqual(withLeftPoint(records, 105), [
    timedRecord({t: 105, v: 2}),
    timedRecord({t: 110, v: 2}),
    timedRecord({t: 120, v: 3}),
  ]);
});

test("gives no points for no records", () => {
  assert.deepEqual(withLeftPoint([], 105), []);
});
