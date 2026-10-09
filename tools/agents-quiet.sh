#!/usr/bin/env bash
# Run a mise task quietly for agents: log everything to reports/<task>.log, print the
# complexity report, then print only the failed tasks and exit 1 if any failed.
#
# Usage: tools/agents-quiet.sh <task>
set -uo pipefail

task="$1"
log="reports/$task.log"

mkdir -p reports
mise run --continue-on-error --output keep-order "$task" > "$log" 2>&1
status=$?

mise run report:complexity

if [ "$status" -ne 0 ]; then
  grep -E "ERROR|exited with status" "$log"
  exit 1
fi
