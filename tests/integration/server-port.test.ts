import {once} from "node:events";
import net from "node:net";
import {expect} from "vitest";

import {listeningPort} from "../../src/server/listening-port.ts";
import {test} from "./test-helpers/spawned-server.ts";

async function freePort() {
  const probe = net.createServer().listen(0);
  await once(probe, "listening");
  const port = listeningPort(probe);
  probe.close();
  await once(probe, "close");
  return port;
}

test("listens on the port PORT names", async ({dataDir, startServer}) => {
  const port = await freePort();

  const {url} = await startServer({PORT: String(port), DATA_DIR: dataDir});

  expect(url).to.equal(`http://127.0.0.1:${port}`);
});
