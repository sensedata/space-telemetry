# Developing

## Prerequisites

You install [mise](https://mise.jdx.dev/) and git. mise installs everything else.

`mise tasks` to see all tasks and their descriptions.

## Setup

`.git-blame-ignore-revs` lists the Biome formatting commit. Run this once so `git blame`
skips it:

```sh
git config blame.ignoreRevsFile .git-blame-ignore-revs
```
