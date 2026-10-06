# Space Telemetry

This is the source code for <https://telemetry.space>.

We'd love to know your [ideas](https://github.com/sensedata/space-telemetry/discussions),
[corrections](https://github.com/sensedata/space-telemetry/issues), and
[pull requests](https://docs.github.com/pull-requests/how-tos/create-pull-requests/creating-a-pull-request).

## Quick Start

Install [Node 26.10](https://nodejs.org) and [pnpm 12.6](https://pnpm.io), or run
`mise install` to get both. Then install this project's dependencies:

```sh
pnpm install --frozen-lockfile --ignore-scripts
```

And run the server:

```sh
pnpm start
```

The startup will print a URL you can open in your browser.

## Developing

Run the client and server, the client rebuilding into `dist/` and the server restarting as
you change each (reload the page to see a rebuild); the unit and integration tests; and a
browser smoke test (which will download a few hundred MB of browser engines when needed).

```sh
mise run dev
mise run test
```

> [!NOTE]
> `mise run dev` reads the live feed. `SOURCE=replay mise run dev` plays the recording
> instead. No test reads from Lightstreamer. Those that would need feed data mock or
> replay.

## Configuration

- `DATA_DIR`: a directory to hold `buffer.json`, which stores the last 150 records of
  every carried channel but STATUS; `carried` in `src/contract/channels.ts` lists them.
  Set to an empty string to disable saving and reading a disk buffer across restarts.
  Defaults to `data/` in the project root, beside `package.json`.
- `PORT`: the port to listen on. Defaults to `3000`.
- `SNAPSHOT_SECONDS`: how long after each save ends the server saves to `DATA_DIR` again.
  Defaults to `30`.
- `SOURCE`: where telemetry comes from. `lightstreamer` is the live ISS feed, `replay`
  plays the recording `src/harness/recordings/1789211888321.jsonl.gz`, and `none` starts
  no source. Defaults to `lightstreamer`. The Docker image omits the recording, so replay
  runs only from a checkout; `src/harness/README.md` lists its options.
- `STATIC_DIR`: the directory the page is served from. Defaults to `dist/` in the project
  root, where `pnpm build` writes it.

## Example Cloud Deployment: Fly.io

Example deployment to one Fly.io machine with a 1 GB volume: ~3 USD / mo before
[outbound data costs](https://fly.io/calculator/) (as of 2026-09). You need
[`flyctl`](https://docs.fly.io/flyctl/install) and a [Fly.io](https://fly.io) account.

> [!NOTE]
> Fly will use the Dockerfile to build everything it needs. The only prerequisite for this
> deployment is `flyctl`. You need neither Docker nor Node.

1. Copy `fly.example.toml` to `fly.toml`.
2. Choose a `primary_region` and set it in your `fly.toml`. `fly platform regions` lists
   the options.

   ```sh
   fly auth login
   fly platform regions
   ```

3. Deploy the app with a persistent volume for its buffer.

   ```sh
   fly apps create <app-name> --save
   fly volumes create data --size 1 --region <primary_region> --yes
   fly deploy --ha=false
   ```

> [!WARNING]
> `--ha=false` because each machine has its own volume and its own buffer, so would need
> time to converge before presenting the same data.

Open `https://<app-name>.fly.dev`.

> [!NOTE]
> With a new volume, the server starts with the seed data,
> `src/server/seed/buffer.json.gz`. Replay is not available on the Fly VM.
