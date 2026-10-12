#!/usr/bin/env bash
# Tag HEAD with the version that heads CHANGES.md, once the gate passes.
#
# The annotated tag carries that version's section as its message. Every refusal comes
# before the gate, so a doomed release fails fast. Nothing is pushed.
set -euo pipefail

fail() { echo "release: $*" >&2; exit 1; }

heading=$(grep -m1 '^## ' CHANGES.md) || fail "CHANGES.md has no '## ' heading."
version=${heading#'## '}
version=${version%% - *}
[[ $version =~ ^[0-9]{4}-[0-9]{2}\.[0-9]{3}$ ]] \
  || fail "'$heading' does not begin with a YYYY-MM.NNN version."

[[ $(git branch --show-current) == main ]] || fail "not on main."
[[ -z $(git status --porcelain) ]] || fail "the working tree has changes."
git fetch --quiet --tags origin main
git merge-base --is-ancestor origin/main HEAD || fail "HEAD is behind origin/main."
if git rev-parse --quiet --verify "refs/tags/$version" >/dev/null; then
  fail "$version is already tagged. Head CHANGES.md with the next version."
fi

head=$(git rev-parse HEAD)
mise run gate
[[ $(git rev-parse HEAD) == "$head" && -z $(git status --porcelain) ]] \
  || fail "HEAD or the working tree changed during the gate."

# whitespace, not the default strip: strip drops the section's '###' headings as comments.
notes=$(awk '/^## /{n++} n == 1' CHANGES.md)
git tag --annotate --cleanup=whitespace --message "${notes#'## '}" "$version"
echo "release: tagged $version. Push it with: git push origin $version"
