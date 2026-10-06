- Run `mise run agents:quick` after every edit to `src/` or `tests/`. Finish an edit that
  spans several files before the run.
- Run `mise run agents:gate` before you report a change to `src/`, `tests/`, or
  configuration done.
- Run `mise run test:mutation` before you report a code change to a test or test
  configuration done.

`agents:quick` and `agents:gate` print only the failed tasks. The full output is in
`reports/quick.log` or `reports/gate.log`, each line prefixed with its `[task]`.

* When traversing, favor tools that are aware of gitignore, e.g., ripgrep.
* Run `mise run report:screenshots` to generate current renders in
  `reports/screenshots/<ISO8601>/<width>-<engine>.png`
