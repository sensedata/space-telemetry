import {vi} from "vitest";

import {test as mountTest} from "./mount.ts";

// Every test of this `test` runs on a fake setInterval, clearInterval and Date, which start at
// `now` and move only as the test advances them. `now` is the real time unless
// `test.override({ now })` sets it for a file or a describe. Views that tick take a Clock, so
// this extends mount's `test`.
export const test = mountTest
  .extend("now", () => Date.now())
  .extend("fakeClock", {auto: true}, ({now}, {onCleanup}) => {
    vi.useFakeTimers({toFake: ["setInterval", "clearInterval", "Date"], now});
    onCleanup(() => {
      vi.useRealTimers();
    });
  });
