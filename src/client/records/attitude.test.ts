import {assert, describe, test} from "vitest";

import {timedRecord} from "../test-helpers/records.ts";
import {attitude} from "./attitude.ts";

// The expected angles come from the closed-form ZYX (yaw, pitch, roll) conversion of the
// normalised quaternion, rounded to six decimal places:
// https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
const DEGREES_TOLERANCE = 1e-6;

describe("the attitude of a quaternion", () => {
  test.for([
    ["roll", "x", 17.102729],
    ["pitch", "y", 17.352261],
    ["yaw", "z", 36.027373],
  ] as const)("gives the %s of 0.1, 0.2, 0.3, 1", ([, axis, expected]) => {
    const angles = attitude(axis)([
      [timedRecord({t: 1, v: 0.1})],
      [timedRecord({t: 1, v: 0.2})],
      [timedRecord({t: 1, v: 0.3})],
      [timedRecord({t: 1, v: 1})],
    ]);

    assert.closeTo(angles.at(-1)?.v ?? NaN, expected, DEGREES_TOLERANCE);
  });

  test("gives the roll of 0.1, 0.2, 0.4, 1", () => {
    const angles = attitude("x")([
      [timedRecord({t: 1, v: 0.1})],
      [timedRecord({t: 1, v: 0.2})],
      [timedRecord({t: 1, v: 0.4})],
      [timedRecord({t: 1, v: 1})],
    ]);

    assert.closeTo(angles.at(-1)?.v ?? NaN, 17.96914, DEGREES_TOLERANCE);
  });

  test.for([
    ["x", [undefined, 0.2, 0.3, 1]],
    ["y", [0.1, undefined, 0.3, 1]],
    ["z", [0.1, 0.2, undefined, 1]],
    ["w", [0.1, 0.2, 0.3, undefined]],
  ] as const)(
    "has no record while the %s axis has none with a value",
    ([, [x, y, z, w]]) => {
      const angles = attitude("x")([
        [timedRecord({t: 1, v: x})],
        [timedRecord({t: 1, v: y})],
        [timedRecord({t: 1, v: z})],
        [timedRecord({t: 1, v: w})],
      ]);

      assert.deepEqual(angles, []);
    },
  );

  test("has a record at each time any axis reports", () => {
    const angles = attitude("x")([
      [timedRecord({t: 1, v: 0.1})],
      [timedRecord({t: 1, v: 0.2})],
      [timedRecord({t: 1, v: 0.3}), timedRecord({t: 2, v: 0.4})],
      [timedRecord({t: 1, v: 1})],
    ]);

    assert.deepEqual(
      angles.map((record) => record.t),
      [1, 2],
    );
  });

  test("keeps an axis's value while its newest record has none", () => {
    const angles = attitude("x")([
      [timedRecord({t: 1, v: 0.1}), timedRecord({t: 2, v: undefined})],
      [timedRecord({t: 1, v: 0.2}), timedRecord({t: 2, v: 0.2})],
      [timedRecord({t: 1, v: 0.3})],
      [timedRecord({t: 1, v: 1})],
    ]);

    assert.closeTo(angles.at(-1)?.v ?? NaN, 17.102729, DEGREES_TOLERANCE);
  });

  test("marks each record with the mean of the angles held", () => {
    const angles = attitude("x")([
      [timedRecord({t: 1, v: 0.1})],
      [timedRecord({t: 1, v: 0.2})],
      [timedRecord({t: 1, v: 0.3}), timedRecord({t: 2, v: 0.4})],
      [timedRecord({t: 1, v: 1})],
    ]);

    // The mean of 17.102729 and 17.969140.
    assert.closeTo(angles.at(-1)?.vm ?? NaN, 17.535935, 1e-5);
  });

  test("refuses a quaternion of other than four channels", () => {
    assert.throws(
      () =>
        attitude("x")([
          [timedRecord({t: 1, v: 0.1})],
          [timedRecord({t: 1, v: 0.2})],
          [timedRecord({t: 1, v: 0.3})],
        ]),
      RangeError,
      /four channels/,
    );
  });
});
