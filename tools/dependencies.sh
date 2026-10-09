#!/usr/bin/env bash
# Mise tools and direct pnpm packages, each with its installed version.
set -euo pipefail

mise ls --current --local

pnpm list --json | jaq -r '
  [ .. | objects | to_entries[]
    | select(.value | type == "object" and has("version"))
    | .key + " - " + .value.version
  ] | unique[]'
