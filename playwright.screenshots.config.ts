import {defineConfig} from "@playwright/test";

import {browsers} from "./playwright.config.ts";

// Clear of playwright.config.ts's 5056, so both suites can run at once.
const port = 5057;

// One width inside each of page.css's breakpoints: below 768, then 768, 992 and 1200 up.
const widths = [390, 800, 1024, 1280];

const colorSchemes = ["light", "dark"] as const;

export default defineConfig({
  testDir: "tests/screenshots",
  // `mise run report:screenshots` passes --output reports/screenshots/<timestamp>.
  outputDir: "reports/screenshots/untimed",
  fullyParallel: true,
  use: {baseURL: `http://localhost:${port}`, locale: "en-US", timezoneId: "UTC"},
  // dashboard.spec.ts names each shot for its project.
  projects: browsers.flatMap((browser) =>
    widths.flatMap((width) =>
      colorSchemes.map((colorScheme) => ({
        name: `${width}-${browser.name}-${colorScheme}`,
        use: {...browser.use, viewport: {width, height: 900}, colorScheme},
      })),
    ),
  ),
  webServer: {
    command: "node --import ./tests/screenshots/frozen-now.ts src/server/server.ts",
    // With no source, the page shows only the seed, which the server restores into an
    // empty DATA_DIR. `mise run report:screenshots` empties DATA_DIR and builds STATIC_DIR.
    env: {
      SOURCE: "none",
      PORT: String(port),
      DATA_DIR: "reports/screenshots-data",
      STATIC_DIR: "reports/screenshots-dist",
    },
    url: `http://localhost:${port}`,
  },
});
