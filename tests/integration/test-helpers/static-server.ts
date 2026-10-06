import {once} from "node:events";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

import {serveStaticFile} from "../../../src/server/serve-static-file.ts";
import {test as tempDirTest} from "../../../src/server/test-helpers/temp-dir.ts";

// root is an empty directory named dist in `dir`; server serves it with serveStaticFile on a
// free port, and closes after the test.
export const test = tempDirTest
  .extend("root", ({dir}) => {
    const root = path.join(dir, "dist");
    fs.mkdirSync(root);
    return root;
  })
  .extend("server", async ({root}, {onCleanup}) => {
    const server = http
      .createServer((req, res) => {
        void serveStaticFile(root, req, res);
      })
      .listen(0);
    await once(server, "listening");
    onCleanup(() => {
      server.close();
    });
    return server;
  });
