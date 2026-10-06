import {release} from "node:os";
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

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "reports/e2e",
  reporter: [["html", {outputFolder: "reports/e2e-report", open: "never"}]],
  use: {baseURL: `http://localhost:${port}`},
  projects: browsers,
  webServer: {
    command: "node src/server/server.ts",
    // Playwright spreads env over its own process.env to start the server, so this empty
    // DATA_DIR, which keeps the server from saving, overrides one the shell exports.
    // `mise run test:browser` builds the page into STATIC_DIR, relative to this file's directory,
    // where Playwright starts the server; not under outputDir, which Playwright empties
    // before it starts the server.
    env: {
      SOURCE: "replay",
      PORT: String(port),
      DATA_DIR: "",
      STATIC_DIR: "reports/e2e-dist",
    },
    url: `http://localhost:${port}`,
  },
});
