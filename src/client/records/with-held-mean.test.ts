import {assert, test} from "vitest";

import {withHeldMean} from "./with-held-mean.ts";

test("marks each record with the mean of the values held", () => {
  const marked = withHeldMean([
    {t: 1, v: 10, vm: 0},
    {t: 2, v: 12, vm: 0},
  ]);

  assert.deepEqual(marked, [
    {t: 1, v: 10, vm: 11},
    {t: 2, v: 12, vm: 11},
  ]);
});
