import {assert, describe, test} from "vitest";

import {timedRecord} from "../test-helpers/records.ts";
import {power} from "./power.ts";

describe("the power of supplies", () => {
  test("is a supply's volts times its amps", () => {
    const watts = power([[timedRecord({t: 1, v: 18})], [timedRecord({t: 1, v: 4})]]);

    assert.equal(watts.at(-1)?.v, 72);
  });

  test("adds the watts of each supply", () => {
    const watts = power([
      [timedRecord({t: 1, v: 18})],
      [timedRecord({t: 1, v: 4})],
      [timedRecord({t: 1, v: 28})],
      [timedRecord({t: 1, v: 2})],
    ]);

    assert.equal(watts.at(-1)?.v, 128);
  });

  test("counts no watts for a supply whose amps have not reported", () => {
    const watts = power([
      [timedRecord({t: 1, v: 18})],
      [timedRecord({t: 1, v: 4})],
      [timedRecord({t: 1, v: 28})],
      [],
    ]);

    assert.equal(watts.at(-1)?.v, 72);
  });

  test("follows each channel's newest value through time", () => {
    const watts = power([
      [timedRecord({t: 1, v: 18})],
      [timedRecord({t: 1, v: 4}), timedRecord({t: 2, v: 5})],
    ]);

    assert.deepEqual(
      watts.map((record) => record.v),
      [72, 90],
    );
  });

  test("marks the mean of the watts held, not the product of the channels' means", () => {
    const watts = power([
      [timedRecord({t: 1, v: 18, vm: 9})],
      [timedRecord({t: 1, v: 4, vm: 2}), timedRecord({t: 2, v: 5, vm: 2})],
    ]);

    assert.equal(watts.at(-1)?.vm, 81);
  });

  test("is nothing while no supply has both its volts and its amps", () => {
    assert.deepEqual(power([[timedRecord({t: 1, v: 18})], []]), []);
  });
});
