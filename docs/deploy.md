# Deploy to Fly.io

This runbook takes the server from this repository to one Fly.io machine with a 1 GB
volume, and checks it there. You need `flyctl` and a Fly.io account.

## Name the app and region

`fly.toml` names both:

- `iss-temporary-fix`: the app, in the `space-telemetry` organisation, served at
  `https://iss-temporary-fix.fly.dev`.
- `lhr`: London, the region for the machine and its volume. It is the nearest Fly region
  to `push.lightstreamer.com`, which resolved to one EC2 host in AWS eu-west-1, Dublin, on
  2026-09-26. `fly platform regions` lists the alternatives.

Change either in `fly.toml` and in the commands below together.

## Create the app and volume

Log in, create the app without `fly launch`, which would rewrite `fly.toml`, and create
the volume `fly.toml` mounts:

```sh
fly auth login
fly apps create iss-temporary-fix
fly volumes create data --size 1 --region lhr --yes
```

## Deploy

`--ha=false` keeps the app to one machine; a second machine would need a second volume and
hold its own buffer.

```sh
fly deploy --ha=false
```

A fresh volume holds no `buffer.json`, so the first boot restores the seed,
`server/seed/buffer.json.gz`: the last 150 records of every channel but STATUS, up to
2026-09-14.

## The volume's owner

Fly.io mounts the volume at `/data` owned by uid 1000, which is the image's `node` user
that the server runs as; the boot log line is
`Mounting /dev/vdc at /data w/ uid: 1000, gid: 1000 and chmod 0755`. No ownership step is
needed. If a future image runs as a different user, `fly logs` shows
`buffer snapshot failed: [Error: EACCES ...` every `SNAPSHOT_SECONDS`, 30 by default, and
the fix is `fly ssh console -C "chown node:node /data"`.

## Check the deploy

### The page

Open `https://iss-temporary-fix.fly.dev`. While the Lightstreamer feed is silent, as it has
been since 2026-09-14, the page shows the buffer's last known values and the header reads
`Telemetry Network: Disconnected`.

```sh
curl -sI https://iss-temporary-fix.fly.dev/index.js
```

The response is `200` with `cache-control: public, max-age=300`.

The RSS feed at `/rss.xml` reads a cache the source fills, not the buffer, so it shows
`null` for every value but STATUS until the feed sends again.

If the name does not resolve, check the resolver before the app: a LAN resolver can return
nothing for any `fly.dev` name while `dig @1.1.1.1 iss-temporary-fix.fly.dev` returns the
address. With that address as `ADDRESS`, this reaches the app:

```sh
curl --resolve iss-temporary-fix.fly.dev:443:ADDRESS https://iss-temporary-fix.fly.dev/
```

### The status channel

Ask the app for a socket.io session; the bundle's client does the same on page load:

```sh
curl -s "https://iss-temporary-fix.fly.dev/socket.io/?EIO=3&transport=polling&b64=1"
```

The response starts with `0{"sid":` and lists `"upgrades":["websocket"]`. For the status
record itself, open the page: the header reads `Telemetry Network: Disconnected`, which is
the `297 STATUS` record `[{"k":"297","v":0,"t":...,"s":2,...}]` rendered.

### The snapshot across a restart

Wait 30 seconds after boot for the first save, then restart the machine. Take
`MACHINE_ID` from the `ID` column of `fly machine list`; the `-q` form pads the id with
spaces, so trim it before use:

```sh
fly machine list
fly machine restart MACHINE_ID
fly logs --no-tail
```

`fly logs` shows these lines:

| When | Line |
| --- | --- |
| Boot without `buffer.json` | `no buffer snapshot at /data/buffer.json` then `restoring the buffer seed /app/server/seed/buffer.json.gz` |
| Every boot | `buffer restored: N records on M channels` then `server starting on host: 0.0.0.0, port: 5000` |
| Boot with a malformed `buffer.json` | `buffer snapshot rejected:` and the defect |
| Stop or restart | `Sending signal SIGINT to main child process` then `exited normally with code: 130` |

Fly.io stops the process with SIGINT, not SIGTERM; the server saves on either. After
`buffer snapshot rejected:` the server starts with an empty buffer and does not restore the
seed.

With the feed silent, both boots show `buffer restored: 44550 records on 297 channels`, the
seed's records. The restart passes when its boot shows that line without the two
`buffer.json` lines above it: the server wrote the records to the volume and read them
back.

### The Lightstreamer feed

The server logs every Lightstreamer connection state change as
`lightstreamer status: <STATE>`. A healthy boot reaches `CONNECTED:WS-STREAMING` within
about ten seconds, by way of `CONNECTING` and `CONNECTED:STREAM-SENSING`; a first attempt
that ends in `DISCONNECTED:WILL-RETRY` before that is normal. When the feed sends
`TIME_000001` again, `fly logs` shows the STATUS record turning connected,
`{ t: ..., sid: ..., k: '297', s: 24, v: 1 }`, and the page's header follows.

## Change the source or save interval

`SOURCE` and `SNAPSHOT_SECONDS` are environment variables, set in the `[env]` block of
`fly.toml`. Edit the block, then deploy again:

```sh
fly deploy --ha=false
```

- `SOURCE = "none"` starts no producer; the server serves only what it restored.
- `SNAPSHOT_SECONDS = "60"` saves 60 seconds after each save ends instead of 30.

`SOURCE = "replay"` does not work on Fly.io: the image holds only the package files,
`server/` and `public/`, so the recording under `harness/recordings/` is absent.

## Serve the site's hostnames

The app serves three names: `www.telemetry.space`; `telemetry.space`, the apex; and
`iss.telemetry.space`, a per-vehicle name. Cloudflare proxies the zone, so each
certificate is issued by DNS challenge and Cloudflare must connect to Fly.io over TLS. For
each name `HOST`, in this order:

1. `fly certs add HOST`, then `fly certs setup HOST` for the records. The `xmgnwzk` label
   below is this app's; a new app prints its own.
2. In Cloudflare: TXT `_fly-ownership.HOST` → `app-xmgnwzk`; CNAME `_acme-challenge.HOST`
   → `HOST.xmgnwzk.flydns.net`, DNS only; CNAME `HOST` →
   `xmgnwzk.iss-temporary-fix.fly.dev`, proxied. For the apex the CNAME is flattened by
   Cloudflare. SSL mode Full for the zone.
3. `fly certs check HOST` until `Status = Issued`; expect about four minutes. While it
   says `Issuing...`, the name answers Cloudflare error 525, because Fly's shared IPv4 has
   no certificate to offer for it yet. A missing TXT or challenge record leaves it at
   `Not verified` with `DNS records do not match`; check them at Cloudflare's own
   nameserver, `dig @kyle.ns.cloudflare.com TXT _fly-ownership.HOST`.
4. `curl -sI https://HOST/` shows `via: 1.1 fly.io` and a `fly-request-id`. The bundle at
   `/index.js` is byte-identical to `public/index.js` through every name.

No name redirects to another; each serves the page. `www` is the canonical name in the RSS
feed.

Cloudflare replaces the bundle's `cache-control` with its own four-hour browser TTL for
JavaScript, so the five-minute header is seen only by requests that bypass Cloudflare.

Cloudflare's Automatic HTTPS Rewrites changes any `http://` link in served HTML to
`https://`. Every link in `public/index.html` is `https://`, so `/` is byte-identical to
the committed file through Cloudflare and direct to Fly alike; keep it so.
