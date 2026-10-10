import {expect, test} from "@playwright/test";

test("a page whose cell is misconfigured warns it may be out of date", async ({page}) => {
  await page.route("/", async (route) => {
    const response = await route.fetch();
    const html = await response.text();
    const misconfigured = html.replace('data-min="0" data-max="100"', 'data-max="100"');
    expect(misconfigured).not.toBe(html);
    await route.fulfill({response, body: misconfigured});
  });

  await page.goto("/");

  await expect(page.getByRole("alert")).toHaveText(
    "Part of this page failed, so what it shows may be out of date. Reload to try again.",
  );
});
