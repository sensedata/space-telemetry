import childProcess, {type ChildProcess} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

import {test as stubPageTest} from "./stub-page.ts";

const serverDir = path.join(import.meta.dirname, "..", "..", "..", "src", "server");
const seedFixture = path.join(import.meta.dirname, "seed.json");

export type Started = {
  child: ChildProcess;
  exited: Promise<{code: number | undefined; signal: NodeJS.Signals | undefined}>;
  // Resolves once the server has logged the end of its replay, and rejects if it exits
  // before that.
  replayed: Promise<void>;
  url: string;
};

// dataDir is a fresh temp directory, removed after the test, and seedFile a gzipped copy of
// seed.json in it, which holds channel 237 and channel 262, one the server does not carry. A
// server seeds a DATA_DIR that holds no buffer.json from SEED_FILE.
// startServer(env, args, server) spawns the server.ts of the directory `server`, src/server/
// unless given, in dataDir, with the command-line `args`, none unless given, and with PORT 0,
// SOURCE none, SEED_FILE seedFile, STATIC_DIR staticDir and then `env` in place of those of
// this process, and resolves once it listens; each child it spawned is killed after the test.
export const test = stubPageTest
  .extend("dataDir", ({}, {onCleanup}) => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "spawned-server-"));
    onCleanup(() => {
      fs.rmSync(dataDir, {recursive: true, force: true});
    });
    return dataDir;
  })
  .extend("seedFile", ({dataDir}) => {
    const seedFile = path.join(dataDir, "seed.json.gz");
    fs.writeFileSync(seedFile, zlib.gzipSync(fs.readFileSync(seedFixture)));
    return seedFile;
  })
  .extend("startServer", ({dataDir, seedFile, staticDir}, {onCleanup}) => {
    const children: ChildProcess[] = [];
    onCleanup(() => {
      for (const child of children) child.kill("SIGKILL");
    });
    return (
      env: NodeJS.ProcessEnv,
      args: string[] = [],
      server = serverDir,
    ): Promise<Started> => {
      // eslint-disable-next-line no-restricted-syntax -- sets the child server's environment
      const {SOURCE, DATA_DIR, SNAPSHOT_SECONDS, SEED_FILE, ...inherited} = process.env;
      const child = childProcess.spawn(
        process.execPath,
        [path.join(server, "server.ts"), ...args],
        {
          // Keeps a write relative to the working directory out of the repo.
          cwd: dataDir,
          env: {
            ...inherited,
            PORT: "0",
            SOURCE: "none",
            SEED_FILE: seedFile,
            STATIC_DIR: staticDir,
            ...env,
          },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      children.push(child);
      const exited = new Promise<Awaited<Started["exited"]>>((resolve) =>
        child.once("exit", (code, signal) => {
          // Node passes null for whichever of the two does not apply.
          resolve({code: code ?? undefined, signal: signal ?? undefined});
        }),
      );
      let output = "";
      const replay: PromiseWithResolvers<void> = Promise.withResolvers();
      // Every child exits, most without replaying, so the rejection counts as handled even
      // where no test awaits replayed.
      void Promise.allSettled([replay.promise]);
      return new Promise((resolve, reject) => {
        child.once("exit", (code) => {
          const error = new Error(`server exited with ${String(code)}: ${output}`);
          reject(error);
          replay.reject(error);
        });
        child.stderr.on("data", (chunk) => {
          output += String(chunk);
        });
        child.stdout.on("data", (chunk) => {
          output += String(chunk);
          const port = /http:\/\/localhost:(\d+)/.exec(output)?.[1];
          if (port !== undefined) {
            resolve({
              child,
              exited,
              replayed: replay.promise,
              // By address: resolving localhost can stall for a test's whole timeout.
              url: `http://127.0.0.1:${port}`,
            });
          }
          if (output.includes("replay finished")) {
            replay.resolve();
          }
        });
      });
    };
  });
