import browserslist from "browserslist";
import {defineConfig} from "vitest/config";

// Supported browsers: browserslist's `defaults`, which caniuse-lite's usage data resolves to
// every browser version over half a percent of global use, plus the current and prior
// version of each. The floor moves with caniuse-lite; browserslist warns at build when
// that data is over six months old.
//
// The engines the bundler names, by browserslist's name. Android's Chrome and Firefox
// track the desktop versions and never lower the floor, so they are left out.
const engines = new Map([
  ["chrome", "chrome"],
  ["edge", "edge"],
  ["firefox", "firefox"],
  ["ios_saf", "ios"],
  ["opera", "opera"],
  ["safari", "safari"],
]);

function buildTargets(): string[] {
  const oldest = new Map<string, number>();
  for (const entry of browserslist("defaults")) {
    const [browser, range] = entry.split(" ", 2);
    const engine = engines.get(browser ?? "");
    // A range such as "18.5-18.7" counts as its low end; Safari's "TP" is NaN.
    const version = Number(range?.split("-", 1)[0]);
    if (engine === undefined || Number.isNaN(version)) continue;
    oldest.set(engine, Math.min(oldest.get(engine) ?? Infinity, version));
  }
  return [...oldest].map(([engine, version]) => `${engine}${version}`);
}

export default defineConfig({
  root: "src/client",
  build: {
    target: buildTargets(),
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
