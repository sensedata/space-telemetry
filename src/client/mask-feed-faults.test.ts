import {assert, describe, test} from "vitest";
import {maskFeedFaults} from "./mask-feed-faults.ts";
import {timedRecord} from "./test-helpers/records.ts";

describe("the oxygen generation rate's fill value", () => {
  // The seed holds the fill value in both spellings.
  test.for([
    ["as the seed spells it first", -59.4568901062012],
    ["as the seed spells it since", -59.45689010620117],
  ] as const)("reads as no value %s", ([, v]) => {
    assert.deepEqual(maskFeedFaults([timedRecord({k: "NODE3000011", v})]), [
      timedRecord({k: "NODE3000011", v: undefined}),
    ]);
  });

  test("leaves a production rate the generator reported", () => {
    const reported = timedRecord({k: "NODE3000011", v: 0.16329325735569});

    assert.deepEqual(maskFeedFaults([reported]), [reported]);
  });

  test("leaves the same value on another channel", () => {
    const reported = timedRecord({k: "USLAB000059", v: -59.45689010620117});

    assert.deepEqual(maskFeedFaults([reported]), [reported]);
  });
});
