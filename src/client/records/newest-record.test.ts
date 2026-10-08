import {assert, describe, test} from "vitest";

import {timedRecord} from "../test-helpers/records.ts";
import type {TimedRecord} from "../timed-record.ts";
import {newestRecord} from "./newest-record.ts";

describe("the newest record", () => {
  test("is undefined for no records", () => {
    assert.isUndefined(newestRecord<TimedRecord>([]));
  });

  test("is the one with the latest time wherever it sits in the list", () => {
    const records = [
      timedRecord({t: 20, v: 1}),
      timedRecord({t: 30, v: 2}),
      timedRecord({t: 10, v: 3}),
    ];

    assert.deepEqual(newestRecord(records), timedRecord({t: 30, v: 2}));
  });

  test("is the later arrival of two within the same second", () => {
    const records = [timedRecord({t: 10, v: 1}), timedRecord({t: 10, v: 2})];

    assert.deepEqual(newestRecord(records), timedRecord({t: 10, v: 2}));
  });
});
