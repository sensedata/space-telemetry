import {assert, test} from "vitest";
import {timedRecord} from "../../test-helpers/records.ts";
import {recordsInForce} from "./records-in-force.ts";

test("gives each second the newest record at or before it", () => {
  const records = [timedRecord({t: 100, v: 1}), timedRecord({t: 102, v: 2})];

  assert.deepEqual(recordsInForce(records, 100, 4), [
    timedRecord({t: 100, v: 1}),
    timedRecord({t: 100, v: 1}),
    timedRecord({t: 102, v: 2}),
    timedRecord({t: 102, v: 2}),
  ]);
});

test("gives no record for a second before the oldest", () => {
  const records = [timedRecord({t: 101, v: 1})];

  assert.deepEqual(recordsInForce(records, 100, 2), [
    undefined,
    timedRecord({t: 101, v: 1}),
  ]);
});

test("gives no points to a chart too narrow for one", () => {
  assert.deepEqual(recordsInForce([timedRecord({t: 100, v: 1})], 100, 0), []);
});
