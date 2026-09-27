# Harness

Local-only tooling for running the server on replayed telemetry. Nothing here is deployed.

## Files

- `probe.js`: connects with the repository's socket.io-client 1.3.7 and prints what the
  server sends for a few channels.
- `recordings/1789211888321.jsonl.gz`: the recording `SOURCE=replay` plays by default.

## Run the server locally

The server keeps recent telemetry in memory and uses no database. It serves the production
client bundle, `public/index.js`: fetched from `https://www.telemetry.space/index.js` on
2026-09-26, built by Heroku on 2025-04-06 from commit `f6038d3` or its neighbour. It
cannot be rebuilt because node-sass 3.3 needs Node 4. With no `SOURCE` the server takes
the live Lightstreamer feed:

```sh
npm ci
PORT=5055 node server/server.js
```

Then in another shell:

```sh
PORT=5055 node harness/probe.js
```

Open `http://localhost:5055` to see the bundle against the local server.

## Replay recorded telemetry

The feed has sent nothing since 2026-09-14. `SOURCE=replay` makes the server take its
records from a recording instead, emitted at their recorded spacing; `server/replay.js`
reads the arguments that follow `server/server.js`. A recording is gzipped JSONL: one
source record, `{k, v, cv, t, s, sid}`, per line, in order of `t`.

The default recording, `harness/recordings/1789211888321.jsonl.gz`, is session
`1789211888321` (2026-09-12 11:18 to 11:36 UTC): 52,342 records, all but nine at status
24, over 117 channels; 21 of them, `TIME_000001` among them, update about once a second or
more often.

To watch moving sparklines in a browser:

```sh
SOURCE=replay PORT=5055 node server/server.js --rebase
```

Then open `http://localhost:5055`.

To see backfill and live records on the probe's channels, `USLAB000059` among them, replay
at ten times speed and probe once the session is 30 seconds in; `USLAB000059` first
appears about 300 recorded seconds into the session:

```sh
SOURCE=replay PORT=5055 node server/server.js --rate 10 --rebase
# in another shell, 40 seconds later
PORT=5055 node harness/probe.js
```

Options:

- `--file PATH` replays another recording.
- `--rate N` divides the recorded spacing by N: `--rate 10` is ten times real speed. The
  default is 1.
- `--rebase` sets each record's `t` to the wall-clock second it is emitted at. Without it
  `t` is the recorded time, and the bundle's charts, which draw the last 45 seconds by
  wall clock, show nothing moving. `TIME_000001`'s value stays the recorded time either
  way.

Under `SOURCE=replay` the server does not load the Lightstreamer adapter, and it skips the
recording's `STATUS` records. `STATUS` follows the replayed `TIME_000001` records:
connected while they arrive, disconnected 10 seconds after the last. The replay stops at
the recording's end and the server keeps running, with `STATUS` disconnected.

## Keep the buffer across restarts

With `DATA_DIR` set the server restores `DATA_DIR/buffer.json` at boot, before its source
starts, and saves it every `SNAPSHOT_SECONDS` (default 30) and on SIGINT or SIGTERM.
`STATUS` is not saved: it reads disconnected at boot until `TIME_000001` arrives.
`SOURCE=none` starts the server with no producer, to serve only what it restored:

```sh
DATA_DIR=/tmp/telemetry SOURCE=none PORT=5055 node server/server.js
```

When `DATA_DIR` holds no `buffer.json`, the server restores the seed,
`server/seed/buffer.json.gz`, instead: the newest 150 records of every channel but
`STATUS`, up to 2026-09-14. The first save writes `buffer.json`, after which the seed no
longer applies. A `buffer.json` the server rejects as malformed is not replaced by the
seed; the server starts empty. `SEED_FILE` names another gzipped snapshot to seed from. A
seeded record keeps its recorded `t`.
