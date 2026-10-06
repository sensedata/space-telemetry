import {assert, test} from "vitest";

import {formatDuration} from "./format-duration.ts";

test.each([
  ["shows zero as zeros", 0, "00:00:00"],
  ["drops the milliseconds", 5999, "00:00:05"],
  ["shows total hours over a day", 93_784_000, "26:03:04"],
  ["signs a negative duration once", -3_723_000, "-01:02:03"],
  ["drops a negative duration's milliseconds toward zero", -5999, "-00:00:05"],
  ["signs a negative duration under a second", -999, "-00:00:00"],
])("%s", (_, milliseconds, expected) => {
  assert.equal(formatDuration(milliseconds), expected);
});
