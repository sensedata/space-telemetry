# Harness

Local-only tooling for running the server on replayed telemetry. Nothing here is deployed.

## Files

- `probe.ts`: opens the server's `/events` stream, which carries the last 450 seconds and
  then the live records of every carried channel, and prints what it sends for a few of
  them. `carried` in `src/contract/channels.ts` lists the carried channels; the probe
  names any other it is given and skips it.
- `recordings/1789211888321.jsonl.gz`: the recording `SOURCE=replay` plays by default.

## Run the server locally

The server keeps recent telemetry in memory and uses no database. It serves the client
bundle that `pnpm build` writes to `dist/`. With no `SOURCE` the server takes the live
Lightstreamer feed:

```sh
pnpm install
pnpm build
PORT=5055 node src/server/server.ts
```

Then in another shell:

```sh
PORT=5055 node src/harness/probe.ts
```

Open `http://localhost:5055` to see the bundle against the local server.

## Replay recorded telemetry

The feed has sent nothing since 2026-09-14. `SOURCE=replay` makes the server take its
records from a recording instead, emitted at their recorded spacing;
`src/server/replay.ts` reads the arguments that follow `src/server/server.ts`. A recording
is gzipped JSONL: one source record, `{k, v, cv, t, s, sid}`, per line, in order of `t`.

The default recording, `src/harness/recordings/1789211888321.jsonl.gz`, is session
`1789211888321` (2026-09-12 11:18 to 11:36 UTC): 52,342 records, all but nine at status
24, over 117 channels; 21 of them, `TIME_000001` among them, update about once a second or
more often.

To watch moving sparklines in a browser:

```sh
SOURCE=replay PORT=5055 node src/server/server.ts
```

Then open `http://localhost:5055`.

To see backfill and live records on the probe's channels, `USLAB000059` among them, replay
at ten times speed and probe once the session is 30 seconds in; `USLAB000059` first
appears about 300 recorded seconds into the session:

```sh
SOURCE=replay PORT=5055 node src/server/server.ts --rate 10
# in another shell, 40 seconds later
PORT=5055 node src/harness/probe.ts
```

Options:

- `--file PATH` replays another recording.
- `--rate N` divides the recorded spacing by N: `--rate 10` is ten times real speed. The
  default is 1.
- `--no-rebase` keeps each record's `t` at the recorded time. By default `t` is the
  wall-clock second the record is emitted at; with `--no-rebase` the bundle's charts,
  which draw 1 second per 3 pixels of their width up to the current wall-clock second,
  show nothing moving. `TIME_000001`'s value stays the recorded time either way.

Under `SOURCE=replay` the server does not load the Lightstreamer client library, and it
skips the recording's `STATUS` records. It keeps and sends only the carried channels'
records, so of the recording's 117 channels 89 reach a client. `STATUS` follows the
replayed `TIME_000001` records: connected while they arrive, disconnected 10 seconds after
the last. The replay stops at the recording's end and the server keeps running, with
`STATUS` disconnected.

## Keep the buffer across restarts

The server keeps its buffer in a data directory: `data/` in the repository, or the
directory `DATA_DIR` names, which the server creates if it is missing. It restores
`buffer.json` from there at boot, before its source starts, and saves it every
`SNAPSHOT_SECONDS` (default 30) and on SIGINT or SIGTERM. An empty `DATA_DIR` turns this
off: the server neither restores, seeds nor saves the buffer. `STATUS` is not saved: it
reads disconnected at boot until `TIME_000001` arrives. `SOURCE=none` starts the server
with no producer, to serve only what it restored:

```sh
DATA_DIR=/tmp/telemetry SOURCE=none PORT=5055 node src/server/server.ts
```

When the data directory holds no `buffer.json`, the server restores the seed,
`src/server/seed/buffer.json.gz`, instead: the newest 150 records of every channel but
`STATUS`, up to 2026-09-14. From a snapshot or the seed it restores only the carried
channels. The first save writes `buffer.json`, after which the seed no longer applies. A
`buffer.json` the server rejects as malformed is not replaced by the seed; the server
starts empty. `SEED_FILE` names another gzipped snapshot to seed from. A seeded record
keeps its recorded `t`.
