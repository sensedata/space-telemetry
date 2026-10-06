# Developing

## Prerequisites

You install [mise](https://mise.jdx.dev/) and git. mise installs everything else,
including Node 26.10 and pnpm 12.6.

`mise tasks` to see all tasks and their descriptions.

## Setup

```sh
mise run setup
```

1. `mise install` tools
2. `pnpm install --frozen-lockfile --ignore-scripts` npm dependencies
3. set git pre-commit to run gitleaks
4. run gitleaks on git history

`.git-blame-ignore-revs` lists the Biome formatting commit. Run this once so `git blame`
skips it:

```sh
git config blame.ignoreRevsFile .git-blame-ignore-revs
```
