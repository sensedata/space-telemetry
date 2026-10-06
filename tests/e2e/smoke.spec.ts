import {expect, test} from "@playwright/test";

// The replay fills a channel when the recording first sends it, so the counts below grow
// with the server's uptime. In trial runs, 62 of the 141 decimal readouts showed a number
// and 18 sparklines had a line about 6 seconds into the replay, 68 and 25 at 10 seconds.
// Each floor is met about 6 seconds in, well inside a 20-second wait that fits within
// Playwright's 30-second test timeout.
const READOUT_FLOOR = 60;
const SPARKLINE_FLOOR = 18;
const FILL_TIMEOUT_MS = 20_000;

test("the built page boots and shows replayed telemetry", async ({page}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  await page.goto("/");
  // The bundle is a module script, which runs before the load event that goto awaits.
  expect(errors).toEqual([]);

  await expect(page.locator("#telemetry-network")).toHaveText("Connected");
  const numericReadouts = page
    .locator(".readout.decimal")
    // eslint-disable-next-line security/detect-unsafe-regex -- the literal dot parts the two digit runs, so no input makes it backtrack
    .filter({hasText: /^\s*-?\d+(\.\d+)?$/});
  await expect
    .poll(() => numericReadouts.count(), {timeout: FILL_TIMEOUT_MS})
    .toBeGreaterThanOrEqual(READOUT_FLOOR);
  const sparklines = page.locator(".sparkline-chart svg.sparkline path");
  await expect
    .poll(() => sparklines.count(), {timeout: FILL_TIMEOUT_MS})
    .toBeGreaterThanOrEqual(SPARKLINE_FLOOR);
  expect(errors).toEqual([]);
});
