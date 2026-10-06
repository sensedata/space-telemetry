import {vi} from "vitest";

import {test as tempDirTest} from "./temp-dir.ts";

// Every test of this `test` runs on a fake Date, setTimeout, clearTimeout, setInterval and
// clearInterval, which start at `now` and move only as the test advances them. `now` is the
// real time unless `test.override({ now })` sets it for a file or a describe. It extends
// temp-dir's `test` for the tests that also write files.
export const test = tempDirTest
  .extend("now", () => Date.now())
  .extend("fakeClock", {auto: true}, ({now}, {onCleanup}) => {
    vi.useFakeTimers({
      toFake: ["Date", "setTimeout", "clearTimeout", "setInterval", "clearInterval"],
      now,
    });
    onCleanup(() => {
      vi.useRealTimers();
    });
  });
