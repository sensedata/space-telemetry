import {assert, describe} from "vitest";
import {timedRecord} from "../test-helpers/records.ts";
import {test} from "./test-helpers/quaternion-store.ts";

// The expected angles come from the closed-form ZYX (yaw, pitch, roll) conversion of the
// normalised quaternion:
// https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
// rounded to six decimal places.
const DEGREES_TOLERANCE = 1e-6;

describe("QuaternionStore", () => {
  test("returns an empty euler without data", ({store}) => {
    assert.deepEqual(store.get(), [{x: undefined, y: undefined, z: undefined}]);
  });

  test("correctly sets the X axis", ({wRelay, xRelay, yRelay, zRelay, store}) => {
    wRelay.send([timedRecord({t: 1, v: 1})]);
    xRelay.send([timedRecord({t: 1, v: 0.1})]);
    yRelay.send([timedRecord({t: 1, v: 0.2})]);
    zRelay.send([timedRecord({t: 1, v: 0.3})]);

    const [{x}] = store.get();
    assert.exists(x);
    assert.closeTo(x, 17.102729, DEGREES_TOLERANCE);
  });

  test("correctly sets the Y axis", ({wRelay, xRelay, yRelay, zRelay, store}) => {
    wRelay.send([timedRecord({t: 1, v: 1})]);
    xRelay.send([timedRecord({t: 1, v: 0.1})]);
    yRelay.send([timedRecord({t: 1, v: 0.2})]);
    zRelay.send([timedRecord({t: 1, v: 0.3})]);

    const [{y}] = store.get();
    assert.exists(y);
    assert.closeTo(y, 17.352261, DEGREES_TOLERANCE);
  });

  test("correctly sets the Z axis", ({wRelay, xRelay, yRelay, zRelay, store}) => {
    wRelay.send([timedRecord({t: 1, v: 1})]);
    xRelay.send([timedRecord({t: 1, v: 0.1})]);
    yRelay.send([timedRecord({t: 1, v: 0.2})]);
    zRelay.send([timedRecord({t: 1, v: 0.3})]);

    const [{z}] = store.get();
    assert.exists(z);
    assert.closeTo(z, 36.027373, DEGREES_TOLERANCE);
  });

  test("takes the newest record of an axis's batch whatever the batch's order", ({
    wRelay,
    xRelay,
    yRelay,
    zRelay,
    store,
  }) => {
    wRelay.send([timedRecord({t: 1, v: 1})]);
    xRelay.send([timedRecord({t: 2, v: 0.1}), timedRecord({t: 1, v: 0.5})]);
    yRelay.send([timedRecord({t: 1, v: 0.2})]);
    zRelay.send([timedRecord({t: 1, v: 0.3})]);

    const [{x}] = store.get();
    assert.exists(x);
    assert.closeTo(x, 17.102729, DEGREES_TOLERANCE);
  });

  test("keeps its angles when an axis's backfill is empty", ({
    wRelay,
    xRelay,
    yRelay,
    zRelay,
    store,
  }) => {
    wRelay.send([timedRecord({t: 1, v: 1})]);
    xRelay.send([timedRecord({t: 1, v: 0.1})]);
    yRelay.send([timedRecord({t: 1, v: 0.2})]);
    zRelay.send([timedRecord({t: 1, v: 0.3})]);

    xRelay.send([]);

    const [{x}] = store.get();
    assert.exists(x);
    assert.closeTo(x, 17.102729, DEGREES_TOLERANCE);
  });

  test("keeps an axis's value when its newest record has none", ({
    wRelay,
    xRelay,
    yRelay,
    zRelay,
    store,
  }) => {
    wRelay.send([timedRecord({t: 1, v: 1})]);
    xRelay.send([timedRecord({t: 1, v: 0.1})]);
    yRelay.send([timedRecord({t: 1, v: 0.2})]);
    zRelay.send([timedRecord({t: 1, v: 0.3})]);

    xRelay.send([timedRecord({t: 2, v: undefined})]);

    const [{x}] = store.get();
    assert.exists(x);
    assert.closeTo(x, 17.102729, DEGREES_TOLERANCE);
  });

  test("correctly updates the euler axes with new data", ({
    wRelay,
    xRelay,
    yRelay,
    zRelay,
    store,
  }) => {
    wRelay.send([timedRecord({t: 1, v: 1})]);
    xRelay.send([timedRecord({t: 1, v: 0.1})]);
    yRelay.send([timedRecord({t: 1, v: 0.2})]);
    zRelay.send([timedRecord({t: 1, v: 0.3})]);

    zRelay.send([timedRecord({t: 2, v: 0.4})]);

    const [{x, y, z}] = store.get();
    assert.exists(x);
    assert.exists(y);
    assert.exists(z);
    assert.closeTo(x, 17.96914, DEGREES_TOLERANCE);
    assert.closeTo(y, 15.335035, DEGREES_TOLERANCE);
    assert.closeTo(z, 46.041627, DEGREES_TOLERANCE);
  });
});
