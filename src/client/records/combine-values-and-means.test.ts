import {assert, describe, test} from "vitest";

import {combineValuesAndMeans} from "./combine-values-and-means.ts";

const largest = (values: readonly number[]) => Math.max(...values);

describe("combining channels' values and means", () => {
  test("keeps the mean while a channel has yet to report", () => {
    const combined = combineValuesAndMeans(
      [
        [{k: "USLAB000059", v: 1, t: 1, s: 24, vm: 10}],
        [{k: "USLAB000060", v: 3, t: 2, s: 24, vm: 30}],
      ],
      largest,
    );

    assert.deepEqual(combined, [
      {t: 1, v: 1, vm: 10},
      {t: 2, v: 3, vm: 30},
    ]);
  });

  test("combines the means where every reporting channel has one", () => {
    const combined = combineValuesAndMeans(
      [
        [{k: "USLAB000059", v: 1, t: 1, s: 24, vm: 10}],
        [{k: "USLAB000060", v: 3, t: 1, s: 24, vm: 30}],
      ],
      largest,
    );

    assert.deepEqual(combined, [{t: 1, v: 3, vm: 30}]);
  });

  test("has no mean where a reporting channel has none", () => {
    const combined = combineValuesAndMeans(
      [
        [{k: "USLAB000059", v: 1, t: 1, s: 24, vm: 10}],
        [{k: "USLAB000060", v: 3, t: 1, s: 24}],
      ],
      largest,
    );

    assert.deepEqual(combined, [{t: 1, v: 3}]);
  });
});
