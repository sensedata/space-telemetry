import {assert, describe, test} from "vitest";

import {timedRecord} from "../test-helpers/records.ts";
import {average} from "./average.ts";

describe("the average of channels", () => {
  test("is the mean of the channels' values", () => {
    const averaged = average([[timedRecord({t: 1, v: 1})], [timedRecord({t: 1, v: 3})]]);

    assert.equal(averaged[0]?.v, 2);
  });

  test("is the mean of the channels' means", () => {
    const averaged = average([
      [timedRecord({t: 1, v: 1, vm: 10})],
      [timedRecord({t: 1, v: 3, vm: 30})],
    ]);

    assert.equal(averaged[0]?.vm, 20);
  });

  test("is over the channels reporting as of each time", () => {
    const averaged = average([
      [timedRecord({t: 1, v: 1}), timedRecord({t: 2, v: 2})],
      [timedRecord({t: 2, v: 3})],
    ]);

    assert.deepEqual(
      averaged.map((record) => record.v),
      [1, 2.5],
    );
  });
});
