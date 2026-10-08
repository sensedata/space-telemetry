import {assert, describe, test} from "vitest";

import {timedRecord} from "../test-helpers/records.ts";
import {lastTransmission} from "./last-transmission.ts";

test("is none while no channel holds a record", () => {
  assert.deepEqual(lastTransmission([[], []], 1000), []);
});

test("is the newest record of any channel", () => {
  const latest = lastTransmission(
    [
      [timedRecord({t: 100, v: 1})],
      [timedRecord({t: 110, v: 2}), timedRecord({t: 90, v: 3})],
    ],
    1000,
  );

  assert.deepEqual(latest, [timedRecord({t: 110, v: 2})]);
});

test("is the later arrival of two within the same second", () => {
  const latest = lastTransmission(
    [[timedRecord({t: 100, v: 1}), timedRecord({t: 100, v: 0})]],
    1000,
  );

  assert.deepEqual(latest, [timedRecord({t: 100, v: 0})]);
});

describe("against the clock", () => {
  test("ignores a record timestamped more than a minute ahead of the clock", () => {
    const latest = lastTransmission(
      [[timedRecord({t: 1_790_619_990, v: 1}), timedRecord({t: 1_790_620_061, v: 2})]],
      1_790_620_000,
    );

    assert.deepEqual(latest, [timedRecord({t: 1_790_619_990, v: 1})]);
  });

  test.for([
    ["less than", 1_790_620_030],
    ["exactly", 1_790_620_060],
  ] as const)("takes a record timestamped %s a minute ahead of the clock", ([, t]) => {
    const latest = lastTransmission([[timedRecord({t, v: 1})]], 1_790_620_000);

    assert.deepEqual(latest, [timedRecord({t, v: 1})]);
  });
});
