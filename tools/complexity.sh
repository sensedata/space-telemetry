#!/usr/bin/env bash
# Cyclomatic complexity over src: the five worst functions and the mean.
#
# Not a gate. A list of suspects: ESLint's complexity rule at threshold 0 reports every
# function with its cyclomatic number.
set -euo pipefail

pnpm exec eslint src --rule 'complexity: [warn, 0]' -f json \
  | jaq -r '
      [ .[] | .filePath as $f | .messages[] | select(.ruleId == "complexity")
        | { n: (.message | capture("complexity of (?<n>[0-9]+)").n | tonumber),
            at: ($f | sub(".*/src/"; "src/")) + ":" + (.line | tostring),
            who: (.message | capture("^(?<w>.+?) has a").w) } ]
      | (sort_by(-.n)[:5][] | "\(.n)\t\(.at)\t\(.who)"),
        "functions \(length)  mean \(map(.n) | add / length * 100 | round / 100)"'
