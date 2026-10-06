import {assert, vi} from "vitest";

import {test} from "../test-helpers/fake-clock.ts";
import {unixNow} from "./unix-now.ts";

test("drops the milliseconds of the current time", () => {
  vi.setSystemTime(1_790_620_005_999);

  assert.equal(unixNow(), 1_790_620_005);
});
