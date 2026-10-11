import http, {type IncomingMessage, type ServerResponse} from "node:http";

import * as channels from "../contract/channels.ts";
import {formatEvent} from "../contract/stream-event.ts";
import type {StreamRecord} from "../contract/stream-record.ts";
import {acceptsGzip} from "./accepts-gzip.ts";
import type {RecordBuffer} from "./buffer.ts";
import {createEventFanout} from "./event-fanout.ts";
import type {FeedRecord} from "./feed-record.ts";
import {meanChannels} from "./mean-channels.ts";
import {roundToSentDecimals} from "./round-to-sent-decimals.ts";
import {serveStaticFile} from "./serve-static-file.ts";
import type {Source} from "./source.ts";

// Rides out at least 70 seconds of a client's stalled link, as the fan-out cuts at most one
// chunk a second. A longer stall costs that client a full backfill.
const MAX_LAG_CHUNKS = 70;

// STATUS leads, as the source sends it live before the TIME_000001 record that moves it.
const backfillOrder = ["STATUS", ...channels.names.filter((name) => name !== "STATUS")];

function toEvent(records: readonly StreamRecord[]) {
  return formatEvent({name: "records", data: records});
}

/**
 * Creates the telemetry server. It stores in `buffer` the records `source` emits and
 * serves them at /events as StreamRecords, gzipped for a client that accepts gzip: one
 * records event of the backfill, then one per live record, sent a second at a time. Every
 * other path it serves from `staticDir`.
 */
export function createServer(
  buffer: Pick<RecordBuffer, "add" | "backfill" | "mean">,
  staticDir: string,
  source: Pick<Source, "on" | "reportDisconnected">,
): http.Server {
  const fanout = createEventFanout(MAX_LAG_CHUNKS);

  function toClient(k: string, records: readonly FeedRecord[]): StreamRecord[] {
    const meanField = meanChannels.has(k) && {vm: roundToSentDecimals(k, buffer.mean(k))};
    return records.map(({v, t, s}) => ({
      k,
      v: roundToSentDecimals(k, v),
      t,
      s,
      ...meanField,
    }));
  }

  function streamEvents(req: IncomingMessage, res: ServerResponse) {
    const gzip = acceptsGzip(req.headers["accept-encoding"]);
    // no-transform keeps Cloudflare from altering the stream's compression.
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      ...(gzip && {"Content-Encoding": "gzip"}),
    });
    // The backfill and joining the ring share one tick, so no record falls between them
    // and none arrives twice.
    const backfill = backfillOrder.flatMap((k) => toClient(k, buffer.backfill(k)));
    fanout.add(res, toEvent(backfill), gzip);
  }

  source.on("data", (record) => {
    // Clients get only what the buffer stores, so neither a Lightstreamer resend nor a
    // channel the server does not carry reaches one.
    if (buffer.add(record)) {
      fanout.append(toEvent(toClient(record.k, [record])));
    }
  });

  // Until TIME_000001 arrives the feed is not known to be up; this record also gives a
  // client STATUS on connection.
  source.reportDisconnected();

  return http.createServer((req, res) => {
    const {pathname} = new URL(req.url ?? "/", "http://localhost");
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, {Allow: "GET, HEAD"}).end();
    } else if (pathname === "/events") {
      streamEvents(req, res);
    } else {
      void serveStaticFile(staticDir, req, res);
    }
  });
}
