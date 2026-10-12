import {release} from "node:os";
import path from "node:path";
import {defineConfig, devices} from "@playwright/test";

// Choose a port clear of the server's default, 3000, and of 5055, where src/harness/probe.ts
// defaults.
const port = 5056;

// Playwright 1.63.0's Firefox does not launch on macOS 27:
// https://github.com/microsoft/playwright/issues/42768
const firefoxLaunches = !(process.platform === "darwin" && parseInt(release()) >= 27);

// The browsers this config and playwright.screenshots.config.ts run.
export const browsers = [
  {name: "chromium", use: devices["Desktop Chrome"]},
  ...(firefoxLaunches ? [{name: "firefox", use: devices["Desktop Firefox"]}] : []),
  {name: "webkit", use: devices["Desktop Safari"]},
];

const outputDir = "reports/e2e";

export default defineConfig({
  testDir: "tests/e2e",
  outputDir,
  reporter: [["html", {outputFolder: "reports/e2e-report", open: "never"}]],
  use: {baseURL: `http://localhost:${port}`},
  projects: browsers,
  webServer: {
    command: "node src/server/server.ts",
    // DATA_DIR sits under outputDir, which Playwright empties before it starts the server,
    // so the server finds no buffer.json and restores the seed the specs depend on.
    // STATIC_DIR, where `mise run test:browser` builds the page, sits outside it to survive
    // that. SEED_FILE repeats the server's default so a shell export can't swap the seed.
    env: {
      SOURCE: "replay",
      PORT: String(port),
      DATA_DIR: path.join(outputDir, "data"),
      SEED_FILE: "src/server/seed/buffer.json.gz",
      STATIC_DIR: "reports/e2e-dist",
    },
    url: `http://localhost:${port}`,
  },
});
