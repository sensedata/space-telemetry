import {assert, test} from "vitest";

import {padInteger} from "./pad-integer.ts";

test.each([
  ["pads the integer part with zeros to the precision", "9.782", 3, "009.782"],
  ["leaves an integer part as wide as the precision", "123.4", 3, "123.4"],
  ["pads before a negative value's sign", "-5.25", 3, "0-5.25"],
])("%s", (_, formatted, precision, expected) => {
  assert.equal(padInteger(formatted, precision), expected);
});
