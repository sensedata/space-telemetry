import {expect, test} from "@playwright/test";

// playwright.config.ts starts the server on the seed, so the backfill fills the page at
// once; the replay then sends a station time each second.

test("the built page boots and streams without an error", async ({page}) => {
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

  // The watch spans a clock tick and a live record, as each redraws the page.
  const groundTime = page.locator("#ground-time");
  const stationTime = page.locator('[data-telemetry-id="TIME_000001"]');
  await expect(stationTime).toHaveText(/\d/);
  const groundTimeBefore = await groundTime.innerText();
  const stationTimeBefore = await stationTime.innerText();
  await expect(groundTime).not.toHaveText(groundTimeBefore);
  await expect(stationTime).not.toHaveText(stationTimeBefore);

  await expect(page.locator("#telemetry-network")).toHaveText("Connected");
  await expect(page.getByRole("alert")).toBeHidden();
  expect(errors).toEqual([]);
});

test("the backfill puts a number in every decimal readout but the masked oxygen rate", async ({
  page,
}) => {
  await page.goto("/");

  // NODE3000011 has sent only a fill value since 2022, which maskFeedFaults blanks, so its
  // readout shows a dash.
  const numericReadouts = page
    .locator('.readout.decimal:not([data-telemetry-id="NODE3000011"])')
    // eslint-disable-next-line security/detect-unsafe-regex -- the literal dot parts the two digit runs, so no input makes it backtrack
    .filter({hasText: /^\s*-?\d+(\.\d+)?$/});
  // index.html holds 131 decimal readouts, NODE3000011's among them.
  await expect(numericReadouts).toHaveCount(130);
});

// The replay's default recording first sends USLAB000059 305 seconds in and Z1000005 98
// seconds in, and never sends NODE2000001. The replay starts with the server, so in a run
// shorter than 98 seconds only the backfill draws these charts.
for (const {chart, mark} of [
  {
    chart: "sparkline",
    mark: '.sparkline-chart[data-telemetry-id="USLAB000059"] svg.sparkline path',
  },
  {chart: "bar", mark: '.bar-chart[data-telemetry-id="NODE2000001"] svg rect.bar'},
  {chart: "bullet", mark: '.bullet-chart[data-telemetry-id="Z1000005"] svg line.measure'},
]) {
  test(`the backfill draws a ${chart} chart`, async ({page}) => {
    await page.goto("/");

    await expect(page.locator(mark).first()).toBeAttached();
  });
}
