import {assert, describe, test} from "vitest";

import {Relay} from "./relay.ts";
import {timedRecord} from "./test-helpers/records.ts";
import type {TimedRecord} from "./timed-record.ts";

describe("Relay", () => {
  test("sends records to every handler registered", () => {
    const relay = new Relay();
    const received: (readonly TimedRecord[])[] = [];
    relay.register((records) => {
      received.push(records);
    });
    relay.register((records) => {
      received.push(records);
    });

    relay.send([timedRecord({t: 1_790_560_000, v: 7})]);

    assert.deepEqual(received, [
      [timedRecord({t: 1_790_560_000, v: 7})],
      [timedRecord({t: 1_790_560_000, v: 7})],
    ]);
  });
});
