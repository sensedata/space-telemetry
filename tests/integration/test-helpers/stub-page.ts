import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {test as eventStreamTest} from "./event-stream.ts";

// staticDir is a fresh temp directory, removed after the test, holding a stub page:
// index.html, which names the script /page.js, and that script.
export const test = eventStreamTest.extend("staticDir", ({}, {onCleanup}) => {
  const staticDir = fs.mkdtempSync(path.join(os.tmpdir(), "stub-page-"));
  onCleanup(() => {
    fs.rmSync(staticDir, {recursive: true, force: true});
  });
  fs.writeFileSync(
    path.join(staticDir, "index.html"),
    '<!doctype html><title>stub</title><script type="module" src="/page.js"></script>',
  );
  fs.writeFileSync(path.join(staticDir, "page.js"), "export {};");
  return staticDir;
});
