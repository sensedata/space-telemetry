import {mkdtemp, rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {test as base} from "vitest";

// dir is a fresh directory under the system's temp directory, removed with its contents after
// the test.
export const test = base.extend("dir", async ({}, {onCleanup}) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "space-telemetry-"));
  onCleanup(() => rm(dir, {recursive: true, force: true}));
  return dir;
});
