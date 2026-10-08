# Space Telemetry

This is the source code for <https://telemetry.space>.

We'd love to know your [ideas](https://github.com/sensedata/space-telemetry/discussions),
[corrections](https://github.com/sensedata/space-telemetry/issues), and
[pull requests](https://docs.github.com/pull-requests/how-tos/create-pull-requests/creating-a-pull-request).

## Quick Start

Install [mise](https://mise.jdx.dev/installing-mise.html). Then:

```sh
mise install
pnpm start
```

The server prints a URL to open in your browser.

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

## Reading the Client

The client under `src/client` uses no framework: a view is a plain function that draws a
DOM node from the signals it reads. Read it in this order.

1. `index.html`: the page. Each cell's `data-` attributes name the telemetry it shows.
2. `page.ts`: the entry. It reads each cell's attributes, builds the view for its class,
   and mounts it.
3. `cell-props.ts`: how a cell's attributes become a view's props. `cell-source.ts`: the
   records a cell's source names among the channels' signals.
4. `views/mount.ts`: `View` and `mount`. A view names its sources and draws a node;
   `mount` draws it into its cell and again each time a source changes.
5. `views/readouts/text-readout.ts`, then `views/charts/sparkline-microchart.ts`: a
   readout and a chart, each built with `createElement` and `createElementNS`.
6. `start-stream.ts`: the event stream from the server and the signal it fills with each
   channel's records.
7. `signals/signal.ts`, then `signals/derived.ts` and `signals/effect.ts`: a signal holds
   a value and tells its listeners of each change; a derived value is computed again from
   its sources on each, and an effect runs again on each.
8. `records/`: the pure functions over a channel's records that the views and the derived
   values call.

Skip `*.test.ts`, `test-helpers/`, `status-dictionary.ts` and `src/contract/channels.ts`
(data), and `src/server` until you want to know where the records come from.

## Configuration

- `DATA_DIR`: a directory to hold `buffer.json`, which stores the last 150 records of
  every channel but STATUS; `names` in `src/contract/channels.ts` lists them. Set to an
  empty string to disable saving and reading a disk buffer across restarts. Defaults to
  `data/` in the project root, beside `package.json`.
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
