import http, {type ServerResponse} from "node:http";

import * as channels from "../contract/channels.ts";
import {formatEvent} from "../contract/stream-event.ts";
import type {StreamRecord} from "../contract/stream-record.ts";
import type {RecordBuffer} from "./buffer.ts";
import {createEventFanout} from "./event-fanout.ts";
import type {FeedRecord} from "./feed-record.ts";
import {serveStaticFile} from "./serve-static-file.ts";
import type {Source} from "./source.ts";

// STATUS leads, as the source sends it live before the TIME_000001 record that moves it.
const backfillOrder = ["STATUS", ...channels.names.filter((name) => name !== "STATUS")];

function toEvent(records: readonly StreamRecord[]) {
  return formatEvent({name: "records", data: records});
}

/**
 * Creates the telemetry server, not yet listening. It stores in `buffer` the records
 * `source` emits, with the feed's STATUS, which starts disconnected, and serves them at
 * /events as one records event of the backfill followed by one per live record. Every
 * other path it serves from `staticDir`.
 */
export function createServer(
  buffer: Pick<RecordBuffer, "add" | "backfill" | "mean">,
  staticDir: string,
  source: Pick<Source, "on" | "reportDisconnected">,
): http.Server {
  // About 70 seconds of the feed at the recording's average of 28 records a second on the
  // carried channels.
  const fanout = createEventFanout(2048);

  function toClient(k: string, records: readonly FeedRecord[]): StreamRecord[] {
    const vm = buffer.mean(k);
    return records.map(({v, t, s}) => ({k, v, t, s, vm}));
  }

  function streamEvents(res: ServerResponse) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    });
    // The backfill and joining the ring share one tick, so no record falls between them
    // and none arrives twice.
    const backfill = backfillOrder.flatMap((k) => toClient(k, buffer.backfill(k)));
    fanout.add(res, toEvent(backfill));
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
      streamEvents(res);
    } else {
      void serveStaticFile(staticDir, req, res);
    }
  });
}
