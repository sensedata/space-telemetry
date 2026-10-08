import {once} from "node:events";
import http, {type RequestListener} from "node:http";
import {test as base, vi} from "vitest";

import {signal} from "../../../src/client/signals/signal.ts";
import {startStream, type Stream} from "../../../src/client/start-stream.ts";
import {listeningPort} from "../../../src/server/listening-port.ts";

// serveStream(handler) starts a server of its own with `handler` on a free port and
// resolves with a Stream at its origin; after the test the Stream closes, the server closes
// with its connections, and real timers, which such a test may fake, return.
export const test = base.extend("serveStream", ({}, {onCleanup}) => {
  const served: {server: http.Server; stream: Stream}[] = [];
  onCleanup(() => {
    for (const {server, stream} of served) {
      stream.close();
      server.closeAllConnections();
      server.close();
    }
    vi.useRealTimers();
  });
  return async (handler: RequestListener) => {
    const server = http.createServer(handler).listen(0);
    await once(server, "listening");
    // By address: resolving localhost can stall for a test's whole timeout.
    const clock = signal(Math.floor(Date.now() / 1000));
    const stream = startStream(clock, `http://127.0.0.1:${listeningPort(server)}`);
    served.push({server, stream});
    return stream;
  };
});
