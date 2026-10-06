import {assert, describe, test} from "vitest";

import {linearScale} from "./linear-scale.ts";

test.each([
  ["maps the domain's minimum to 0", 1.5, 0],
  ["maps the domain's maximum to the length", 9.5, 100],
  ["maps a value between in proportion", 3.5, 25],
])("%s", (_, value, expected) => {
  assert.equal(linearScale({min: 1.5, max: 9.5}, 100)(value), expected);
});

test("extends past its domain", () => {
  assert.equal(linearScale({min: 1.5, max: 9.5}, 100)(11.5), 125);
});

test("counts no value as 0", () => {
  assert.equal(linearScale({min: -10, max: 10}, 100)(undefined), 50);
});

test("maps a value that is not a number to NaN", () => {
  assert.isNaN(linearScale({min: 0, max: 10}, 100)(NaN));
});

describe("with a domain of one value", () => {
  test.each([
    ["maps that value to 0", 5, 0],
    ["maps a greater value to 0", 7, 0],
    ["maps a lesser value to 0", 3, 0],
  ])("%s", (_, value, expected) => {
    assert.equal(linearScale({min: 5, max: 5}, 10)(value), expected);
  });
});
