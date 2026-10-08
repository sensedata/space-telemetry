import {defineConfig} from "vitest/config";

// When build.target was last set; tests/integration/browser-targets.test.ts fails once this
// is more than 90 days old.
export const targetsAsOf = "2026-09-27";

export default defineConfig({
  root: "src/client",
  build: {
    // Supported browsers: the current and prior major versions of Chrome, Firefox and Safari
    // (macOS and iOS), as of targetsAsOf.
    target: ["chrome153", "firefox155", "safari26", "ios26"],
    outDir: "../../dist",
    emptyOutDir: true,
  },
  test: {
    root: ".",
    // A zone off UTC by a half hour, with daylight saving, so a test of a time shows any
    // conversion to the local zone.
    env: {TZ: "America/St_Johns"},
    // The lint rules forbid test hooks, so the runner does the resetting.
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,

    // The server tests and app.test.ts open real /events streams with EventSource. We
    // enable it and suppress the warning about it.
    execArgv: ["--experimental-eventsource", "--disable-warning=UNDICI-ES"],

    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/harness/**", "**/test-helpers/**", "**/*.test.*"],
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "reports/coverage",
    },

    projects: [
      {
        extends: true,
        test: {
          name: "unit-server",
          include: ["src/server/**/*.test.ts", "src/contract/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "unit-client",
          include: ["src/client/**/*.test.ts"],
          environment: "jsdom",
        },
      },
      {
        extends: true,
        // app.test.ts drives a real server through Node's EventSource, which dispatches
        // Node's Event; jsdom replaces the global Event, so this file runs in node.
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
        },
      },
    ],
  },
});
