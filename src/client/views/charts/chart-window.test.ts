import {assert, test} from "vitest";
import {timedRecord} from "../../test-helpers/records.ts";
import {chartWindow} from "./chart-window.ts";

test("holds a point for each whole three pixels of width", () => {
  assert.equal(chartWindow([], 11, 1_000_000).availablePoints, 3);
});

test("starts a second per point before now", () => {
  assert.equal(chartWindow([], 12, 1_000_000).earliest, 999_996);
});

test("places the record in force at its start and carries the newest forward to now", () => {
  const records = [timedRecord({t: 999_990, v: 1}), timedRecord({t: 999_997, v: 2})];

  assert.deepEqual(chartWindow(records, 12, 1_000_000).records, [
    timedRecord({t: 999_996, v: 1}),
    timedRecord({t: 999_997, v: 2}),
    timedRecord({t: 1_000_000, v: 2}),
  ]);
});
