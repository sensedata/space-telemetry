import {assert, test} from "vitest";

import {transmissionDelay} from "./transmission-delay.ts";

test.each([
  [
    "measures the delay since a transmission in milliseconds",
    1_790_620_000,
    1_790_620_005_999,
    5999,
  ],
  [
    "measures a transmission after now as a negative delay",
    1_790_620_001,
    1_790_620_000_500,
    -500,
  ],
])("%s", (_, transmitted, now, expected) => {
  assert.equal(transmissionDelay(transmitted, now), expected);
});
