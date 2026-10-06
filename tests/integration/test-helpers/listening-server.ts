import {once} from "node:events";
import http from "node:http";

import {test as fakeClockTest} from "../../../src/server/test-helpers/fake-clock.ts";

// server is an HTTP server with no request listener, listening on a free port, closed with
// its connections after the test. The fake clock of fake-clock.ts runs under every test.
export const test = fakeClockTest.extend("server", async ({}, {onCleanup}) => {
  const server = http.createServer().listen(0);
  await once(server, "listening");
  onCleanup(() => {
    server.closeAllConnections();
    server.close();
  });
  return server;
});
