import {once} from "node:events";
import {vi} from "vitest";

import {createBuffer} from "../../../src/server/buffer.ts";
import {createServer} from "../../../src/server/create-server.ts";
import {createSource} from "../../../src/server/source.ts";
import {startSource} from "../../../src/server/start-source.ts";
import {
  type CapturedRow,
  capturedRows,
} from "../../../src/server/test-helpers/captured-rows.ts";
import {
  createFakeLightstreamer,
  type FakeLightstreamer,
} from "../../../src/server/test-helpers/lightstreamer-client.ts";
import {listeningPort} from "../../../src/server/listening-port.ts";
import {test as stubPageTest} from "./stub-page.ts";

// The ISS feed's TimeStamp counts decimal hours from 00:00 UTC on 1 January of the current
// year, starting at 24. Half a second keeps the server's truncation on the intended second.
function feedTimestamp(unixSeconds: number) {
  const yearStart = Date.UTC(new Date().getUTCFullYear(), 0) / 1000;
  return String((unixSeconds - yearStart + 0.5) / 3600 + 24);
}

// The backfill window counts back from now, so the row is fed stamped `unixSeconds`
// rather than its recorded time.
function feedRow(
  feed: FakeLightstreamer,
  row: CapturedRow | undefined,
  unixSeconds: number,
) {
  if (row === undefined) {
    throw new RangeError("the capture holds no such row");
  }
  feed.update(row.item, {
    TimeStamp: feedTimestamp(unixSeconds),
    Value: row.value,
    "Status.Class": String(row.status),
    CalibratedData: row.value_calibrated,
  });
}

function feedTime(feed: FakeLightstreamer) {
  feedRow(feed, capturedRows("TIME_000001")[0], Math.trunc(Date.now() / 1000));
}

// Every test of this `test` runs on a fake setTimeout, clearTimeout, setInterval,
// clearInterval and Date, from the real time. Each starts a server of its own on a free port,
// as every stream gets every carried channel's backfill: created by createServer over a
// source of its own, serving staticDir and saving nothing, with startSource's lightstreamer
// source over a fresh fake Lightstreamer. Each server is fed a TIME_000001 record, so it
// reports the feed connected and streams telemetry, and closes with its connections after
// the test. serverUrl is its address and source its source; feedRow(row, unixSeconds) and
// feedTime() feed it through its fake Lightstreamer, and open() opens a stream from it.
export const test = stubPageTest
  .extend("fakeClock", {auto: true}, ({}, {onCleanup}) => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"],
    });
    onCleanup(() => {
      vi.useRealTimers();
    });
  })
  .extend("server", async ({staticDir}, {onCleanup}) => {
    const feed = createFakeLightstreamer();
    const source = createSource();
    const server = createServer(createBuffer(), staticDir, source).listen(0);
    onCleanup(() => {
      server.closeAllConnections();
      server.close();
    });
    await once(server, "listening");
    await startSource("lightstreamer", [], source, () => Promise.resolve(feed.module));
    feedTime(feed);
    // By address: resolving localhost can stall for a test's whole timeout.
    return {url: `http://127.0.0.1:${listeningPort(server)}`, feed, source};
  })
  .extend("serverUrl", ({server}) => server.url)
  .extend("source", ({server}) => server.source)
  .extend(
    "feedRow",
    ({server}) =>
      (row: CapturedRow | undefined, unixSeconds: number) => {
        feedRow(server.feed, row, unixSeconds);
      },
  )
  .extend("feedTime", ({server}) => () => {
    feedTime(server.feed);
  })
  .extend(
    "open",
    ({serverUrl, openStream}) =>
      () =>
        openStream(serverUrl),
  );
