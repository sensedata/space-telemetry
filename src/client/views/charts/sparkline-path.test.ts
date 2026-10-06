import {assert, test} from "vitest";
import {timedRecord} from "../../test-helpers/records.ts";
import type {LinearScale} from "./linear-scale.ts";
import {sparklinePath} from "./sparkline-path.ts";

const unscaled: LinearScale = (value) => value ?? 0;

test("draws a basis spline through the records", () => {
  const records = [
    timedRecord({t: 0, v: 0}),
    timedRecord({t: 1, v: 2}),
    timedRecord({t: 3, v: 4}),
  ];

  // The spline's control points are the thirds and sixths between the records. d3-shape
  // rounds them to 3 decimals, and 0.0005 px is invisible.
  assert.equal(
    sparklinePath(records, unscaled, unscaled),
    "M0,0L0.167,0.333C0.333,0.667,0.667,1.333,1.167,2C1.667,2.667,2.333,3.333,2.667,3.667L3,4",
  );
});

test("places each record's time on the x scale and its value on the y scale", () => {
  const records = [timedRecord({t: 1, v: 5}), timedRecord({t: 2, v: 6})];

  assert.equal(
    sparklinePath(
      records,
      (t) => (t ?? 0) * 10,
      (v) => (v ?? 0) + 1,
    ),
    "M10,6L20,7",
  );
});
