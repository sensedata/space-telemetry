import {expect, test} from "vitest";

import {roundToSentDecimals} from "./round-to-sent-decimals.ts";

// index.html shows USLAB000059 at data-scale="2".
test("rounds a value to the decimals the page needs of its channel", () => {
  expect(roundToSentDecimals("USLAB000059", 23.26046371459961)).toBe(23.26);
});

test("refuses a channel outside the data dictionary, naming it", () => {
  expect(() => roundToSentDecimals("USLAB000085", 1)).toThrow(
    new RangeError("no channel USLAB000085 in the data dictionary"),
  );
});
