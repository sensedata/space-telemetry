import {assert, test} from "vitest";

import {svgElement} from "./svg-element.ts";

test("makes an element in the SVG namespace", () => {
  const rect = svgElement("rect", {});

  assert.equal(rect.namespaceURI, "http://www.w3.org/2000/svg");
});

test("writes each attribute as a string", () => {
  const rect = svgElement("rect", {class: "bar", x: 3, width: 2.5});

  assert.deepEqual(
    [rect.getAttribute("class"), rect.getAttribute("x"), rect.getAttribute("width")],
    ["bar", "3", "2.5"],
  );
});

test("leaves an undefined attribute unset", () => {
  const path = svgElement("path", {d: undefined});

  assert.equal(path.hasAttribute("d"), false);
});

test("holds its children in order", () => {
  const group = svgElement("g", {}, [svgElement("rect", {}), svgElement("circle", {})]);

  assert.deepEqual(
    [...group.children].map((child) => child.tagName),
    ["rect", "circle"],
  );
});
