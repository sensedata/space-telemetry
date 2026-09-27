# Space Telemetry
This is the source code for <https://www.telemetry.space>.

We'd love to know your ideas and corrections and [pull requests](https://help.github.com/articles/using-pull-requests/).

# Setup

Install Node 24 or later, then the dependencies:

    $ npm ci

# Run

    $ npm start

The server listens on port 5000 and serves `public/`: the page and its client bundle,
`public/index.js`. It keeps a buffer of the last 150 records of each channel in memory and
sends them to the bundle over socket.io. These environment variables configure it:

- `PORT`: the port to listen on; 5000 by default.
- `SOURCE`: where telemetry comes from. `lightstreamer`, the default, is the live ISS feed;
  `replay` plays the recording `harness/recordings/1789211888321.jsonl.gz`; `none` starts
  no source.
- `DATA_DIR`: a directory to keep the buffer in, as `buffer.json`, across restarts. When it
  holds no `buffer.json`, the server restores the seed `server/seed/buffer.json.gz`: the
  last 150 records of every channel but STATUS, up to 2026-09-14. Unset, the server
  neither keeps nor seeds the buffer.
- `SNAPSHOT_SECONDS`: how long after each save ends the server saves to `DATA_DIR` again;
  30 by default. The server also saves on SIGINT and SIGTERM.
- `SEED_FILE`: a gzipped snapshot to restore in place of `server/seed/buffer.json.gz`.

`harness/README.md` covers running the server locally, replay and its options, and the
seed.

# Test

    $ npm test

# Deploy

`docs/deploy.md` deploys the server to Fly.io with the repository's `Dockerfile` and
`fly.toml`.

# The client bundle

`public/index.js` is the production build of 2025-04-06 and is committed as it is.
`client/` is its source and `test/client/` its tests. They cannot be built or run with the
current toolchain: the build needs node-sass 3.3, which needs Node 4.

# Making a Great Pull Request
1. Familiarize yourself with GitHub pull requests: <https://help.github.com/articles/using-pull-requests/>

2. Fork this repository.

3. Create a topic branch (in your fork) from the tip of the develop branch, for
example if your adding a fancy feature, you'd create your topic branch from develop by running:

        $ git checkout -b add-some-fancy-feature develop

4. Add tests to test/server for all your changes.

5. Send a pull request!
