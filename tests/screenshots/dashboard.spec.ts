import {expect, test} from "@playwright/test";

import {FROZEN_MS} from "./frozen-time.ts";

test("the dashboard renders the seed", async ({page}, testInfo) => {
  await page.clock.setFixedTime(FROZEN_MS);
  await page.goto("/");
  // The seed's newest STATUS record reports the feed silent, so this text marks the
  // backfill's arrival.
  await expect(page.locator("#telemetry-network")).toHaveText("No signal");
  await page.screenshot({
    path: `${testInfo.project.outputDir}/${testInfo.project.name}.png`,
    fullPage: true,
  });
});
