import fs from "node:fs";
import path from "node:path";

import {type CellProps, parseCellProps} from "../../../src/client/cell-props.ts";

// The props of each telemetry cell of src/client/index.html that `selector` matches. Its
// caller's test file declares `@vitest-environment jsdom`: the integration project in
// vite.config.ts runs in node, which has no DOMParser.
export function pageCells(selector: string): CellProps[] {
  const html = fs.readFileSync(
    path.join(import.meta.dirname, "..", "..", "..", "src", "client", "index.html"),
    "utf8",
  );
  const page = new DOMParser().parseFromString(html, "text/html");
  return [...page.querySelectorAll(selector)].flatMap(
    (cell) => parseCellProps(cell) ?? [],
  );
}
