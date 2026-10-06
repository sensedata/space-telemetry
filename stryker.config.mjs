export default {
  packageManager: "pnpm",
  timeoutMS: 10_000,

  testRunner: "vitest",
  plugins: [
    "@stryker-mutator/vitest-runner",
    "@stryker-mutator/typescript-checker",
    "./stryker-ignore-console.mjs",
  ],

  ignorers: ["console"],
  checkers: ["typescript"],

  reporters: ["clear-text", "progress", "html", "json"],
  htmlReporter: {fileName: "reports/mutation/index.html"},
  jsonReporter: {fileName: "reports/mutation/index.json"},
  coverageAnalysis: "perTest",

  incremental: true,
  cleanTempDir: "always",
  // Other tasks write reports/ while the sandbox is copied; no test reads it.
  ignorePatterns: ["/reports"],

  tsconfigFile: "tsconfig.json",

  mutate: [
    "src/contract/**/*.ts",
    "src/server/**/*.ts",
    "src/client/**/*.{ts,tsx}",
    "!**/*.test.{ts,tsx}",
    "!**/test-helpers/**",

    // Data: each entry is a literal Stryker would mutate, and only a test that restates
    // the data could kill the mutant.
    "!src/contract/channels.ts",
    "!src/client/views/status-dictionary.ts",
  ],
};
