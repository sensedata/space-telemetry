import {assert, test} from "vitest";

import {span} from "./span.ts";

test("holds the text", () => {
  assert.equal(span("Connected").outerHTML, "<span>Connected</span>");
});

test("carries the attributes", () => {
  const alarmed = span("-", {class: "time-alarm", "data-raw": "NaN"});

  assert.equal(alarmed.outerHTML, '<span class="time-alarm" data-raw="NaN">-</span>');
});
