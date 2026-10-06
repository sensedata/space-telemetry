import {createBuffer} from "./buffer.ts";
import {config} from "./config.ts";
import {createServer} from "./create-server.ts";
import {listeningPort} from "./listening-port.ts";
import * as persist from "./persist.ts";
import {createSource} from "./source.ts";
import {startSource} from "./start-source.ts";

const host = "0.0.0.0";

const buffer = createBuffer();
if (config.dataDir !== undefined) {
  persist.keep(buffer, config.dataDir, config.snapshotSeconds, config.seedFile);
}

const source = createSource();
const server = createServer(buffer, config.staticDir, source);

server.listen(config.port, host, () => {
  const port = listeningPort(server);
  console.log(`server listening on ${host}:${port}, open http://localhost:${port}`);
});

await startSource(
  config.source,
  process.argv.slice(2),
  source,
  () => import("lightstreamer-client-node"),
);
