import {expect, test} from "@playwright/test";

// page.css gives a thermal table's header column this share of the table at 375px and below.
const HEADER_SHARE = 0.3;

test("a window narrowed to 375px gives each thermal table's header its share", async ({
  page,
}) => {
  await page.setViewportSize({width: 390, height: 900});
  await page.goto("/");
  const thermalTables = page.locator(".thermal-table");
  await expect
    .poll(() =>
      thermalTables.evaluateAll((tables) =>
        tables.every((table) => table.querySelector(":scope td.microchart svg") !== null),
      ),
    )
    .toBe(true);

  await page.setViewportSize({width: 375, height: 900});

  await expect
    .poll(() =>
      thermalTables.evaluateAll((tables) =>
        tables.map((table) => {
          const header = table.querySelector(":scope tbody th");
          if (header === null) {
            throw new TypeError("a thermal table has no row header");
          }
          const share =
            header.getBoundingClientRect().width / table.getBoundingClientRect().width;
          // To the hundredth, as a layout in fractional pixels seldom divides exactly.
          return Math.round(share * 100) / 100;
        }),
      ),
    )
    .toEqual([HEADER_SHARE, HEADER_SHARE, HEADER_SHARE, HEADER_SHARE]);
});

test("a window narrowed below 768px keeps the gyroscope momentum chart's height", async ({
  page,
}) => {
  await page.setViewportSize({width: 800, height: 900});
  await page.goto("/");
  const chart = page.locator(".saturation .bullet-chart");
  await expect(chart.locator("svg")).toHaveCount(1);
  const height = () =>
    chart.evaluate((element) => element.getBoundingClientRect().height);
  const wideHeight = await height();

  await page.setViewportSize({width: 390, height: 900});
  // A chart that grows its container grows it again on each frame it is redrawn.
  await page.evaluate(
    async () =>
      new Promise<void>((resolve) => {
        let frames = 10;
        const tick = () => {
          frames -= 1;
          if (frames === 0) {
            resolve();
          } else {
            requestAnimationFrame(tick);
          }
        };
        requestAnimationFrame(tick);
      }),
  );

  expect(await height()).toBe(wideHeight);
});
