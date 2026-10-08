import {expect, test} from "@playwright/test";

import {FROZEN_MS} from "./frozen-time.ts";

test("the dashboard renders the seed", async ({page}, testInfo) => {
  await page.clock.setFixedTime(FROZEN_MS);
  await page.goto("/");
  // The seed's newest STATUS record reports the feed silent, so this text marks the
  // backfill's arrival.
  await expect(page.locator("#telemetry-network")).toHaveText("No signal");
  // The page draws a chart in each chart cell with a content box at the browser's first
  // rendering update, which WebKit can make after the backfill arrives.
  const cellsWithBox = await page.locator(".microchart").evaluateAll(
    (cells) =>
      cells.filter((cell) => {
        const style = getComputedStyle(cell);
        const px = (property: string) =>
          // eslint-disable-next-line unicorn/prefer-number-coercion -- a computed length reads "8px", which Number makes NaN
          Number.parseFloat(style.getPropertyValue(property));
        return (
          cell.clientWidth > px("padding-left") + px("padding-right") &&
          cell.clientHeight > px("padding-top") + px("padding-bottom")
        );
      }).length,
  );
  await expect(page.locator(".microchart svg")).toHaveCount(cellsWithBox);
  await page.screenshot({
    path: `${testInfo.project.outputDir}/${testInfo.project.name}.png`,
    fullPage: true,
  });
});
