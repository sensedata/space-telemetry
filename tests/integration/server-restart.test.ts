import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import {describe, expect} from "vitest";

import type {FeedRecord} from "../../src/server/feed-record.ts";
import type {EventStream} from "./test-helpers/event-stream.ts";
import {pickFields} from "./test-helpers/pick-fields.ts";
import {test} from "./test-helpers/spawned-server.ts";

const sourceDir = path.join(import.meta.dirname, "..", "..", "src");

const TIME_000001 = 296;

// With DATA_DIR unset a server saves to data/ at the root of its tree, so a test that leaves
// DATA_DIR unset or empty starts the copy of src/server/ that copyServer makes outside the
// repo, where a server that misreads DATA_DIR cannot write into the repo.
// Copies src/server/ and the src/contract/ it imports into `tree`; answers the copy of
// src/server/.
function copyServer(tree: string) {
  for (const dir of ["server", "contract"]) {
    fs.cpSync(path.join(sourceDir, dir), path.join(tree, "src", dir), {
      recursive: true,
    });
  }
  return path.join(tree, "src", "server");
}

// Writes `records` into `dir` as a recording, and answers the command-line arguments with
// which a server of SOURCE replay emits them unchanged, a million times faster than recorded.
function replayOf(dir: string, records: readonly FeedRecord[]) {
  const file = path.join(dir, "recording.jsonl.gz");
  fs.writeFileSync(
    file,
    zlib.gzipSync(records.map((record) => JSON.stringify(record) + "\n").join("")),
  );
  return ["--file", file, "--no-rebase", "--rate", "1000000"];
}

// Resolves with the backfill a new stream from `openStream` gets for `channel`.
function backfill(
  openStream: (url: string) => EventStream,
  url: string,
  channel: number,
) {
  return openStream(url).next(String(channel));
}

function snapshotHolding(file: string, channel: number) {
  const holds = () => {
    try {
      const snapshot: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
      return (
        typeof snapshot === "object" &&
        snapshot !== null &&
        Object.hasOwn(snapshot, channel)
      );
    } catch {
      return false;
    }
  };
  return new Promise<void>((resolve) => {
    const watcher = fs.watch(path.dirname(file), () => {
      if (!holds()) {
        return;
      }

      watcher.close();
      resolve();
    });
    if (!holds()) {
      return;
    }

    watcher.close();
    resolve();
  });
}

describe("server restart", {timeout: 10_000}, () => {
  test.for(["SIGINT", "SIGTERM"] as const)(
    "serves the records it held before %s after a restart",
    async (signal, {dataDir, openStream, startServer}) => {
      // The backfill holds the last 450 seconds of the child's clock, which is not mocked.
      const now = Math.trunc(Date.now() / 1000);
      const first = await startServer(
        {DATA_DIR: dataDir, SOURCE: "replay"},
        replayOf(dataDir, [
          {k: 221, v: 1, cv: "1", t: now - 20, s: 24, sid: 1},
          {k: 221, v: 2, cv: "2", t: now - 10, s: 24, sid: 1},
        ]),
      );
      await first.replayed;
      first.child.kill(signal);
      await first.exited;

      const second = await startServer({DATA_DIR: dataDir});
      const reply = await backfill(openStream, second.url, 221);

      expect(pickFields(reply, ["v", "t"])).toStrictEqual([
        {v: 1, t: now - 20},
        {v: 2, t: now - 10},
      ]);
    },
  );

  test("replaces the snapshot file rather than writing into it on SIGTERM", async ({
    dataDir,
    startServer,
  }) => {
    const file = path.join(dataDir, "buffer.json");
    fs.writeFileSync(file, "{}");
    const replaced = fs.statSync(file).ino;
    const {child, exited} = await startServer({DATA_DIR: dataDir});

    child.kill("SIGTERM");
    await exited;

    expect(fs.statSync(file).ino).to.not.equal(replaced);
  });

  test.for([
    ["SIGINT", 130],
    ["SIGTERM", 143],
  ] as const)(
    "exits on %s with code %i",
    async ([signal, code], {dataDir, startServer}) => {
      const {child, exited} = await startServer({DATA_DIR: dataDir});

      child.kill(signal);

      const exit = await exited;
      expect(exit.code).to.equal(code);
    },
  );

  test("serves the records of its last periodic snapshot after being killed", async ({
    startServer,
    dataDir,
    openStream,
  }) => {
    const first = await startServer(
      {DATA_DIR: dataDir, SNAPSHOT_SECONDS: "0.1", SOURCE: "replay"},
      replayOf(dataDir, [
        {k: 221, v: 10, cv: "Track 3 Sat", t: 1_789_211_895, s: 24, sid: 1},
      ]),
    );
    await snapshotHolding(path.join(dataDir, "buffer.json"), 221);
    first.child.kill("SIGKILL");
    await first.exited;

    const second = await startServer({DATA_DIR: dataDir});
    const reply = await backfill(openStream, second.url, 221);

    expect(pickFields(reply, ["v", "t"])).toStrictEqual([{v: 10, t: 1_789_211_895}]);
  });

  test("sends STATUS disconnected to a new stream after a restart while connected", async ({
    startServer,
    dataDir,
    openStream,
  }) => {
    const first = await startServer(
      {DATA_DIR: dataDir, SOURCE: "replay"},
      replayOf(dataDir, [
        {
          k: TIME_000001,
          v: 1_789_211_888,
          cv: "1789211888",
          t: 1_789_211_888,
          s: 24,
          sid: 1,
        },
      ]),
    );
    await first.replayed;
    first.child.kill("SIGTERM");
    await first.exited;

    const second = await startServer({DATA_DIR: dataDir});
    const status = await backfill(openStream, second.url, 297);

    expect(pickFields(status, ["v", "s"])).toStrictEqual([{v: 0, s: 2}]);
  });

  test("sends STATUS disconnected to a new stream when started with no snapshot and no source", async ({
    startServer,
    dataDir,
    openStream,
  }) => {
    const {url} = await startServer({DATA_DIR: dataDir});

    const status = await backfill(openStream, url, 297);

    expect(pickFields(status, ["v", "s"])).toStrictEqual([{v: 0, s: 2}]);
  });

  // The seed's records are older than the 450 seconds a backfill holds, so it holds the
  // latest alone.
  test("serves the seed when its data directory holds no snapshot", async ({
    startServer,
    dataDir,
    seedFile,
    openStream,
  }) => {
    const {url} = await startServer({DATA_DIR: dataDir, SEED_FILE: seedFile});

    const reply = await backfill(openStream, url, 237);

    expect(pickFields(reply, ["v", "t"])).toStrictEqual([
      {v: 23.57479476928711, t: 1_789_395_274},
    ]);
  });

  // EventSource dispatches a stream's events in order, and 262 comes before 264 in the
  // backfill, so an event on 262 would have arrived before the one on 264.
  test("sends no seeded record of a channel it does not carry", async ({
    startServer,
    dataDir,
    seedFile,
    openStream,
  }) => {
    const {url} = await startServer({DATA_DIR: dataDir, SEED_FILE: seedFile});
    const stream = openStream(url);
    const uncarried: string[] = [];
    stream.source.addEventListener("262", (event: MessageEvent<string>) => {
      uncarried.push(event.data);
    });

    await stream.next("264");

    expect(uncarried).to.deep.equal([]);
  });

  test("starts empty rather than seeded when its snapshot is malformed", async ({
    dataDir,
    startServer,
    seedFile,
    openStream,
  }) => {
    fs.writeFileSync(
      path.join(dataDir, "buffer.json"),
      '{"237": [{"k": 237, "v": 23.32332992553711',
    );
    const {url} = await startServer({DATA_DIR: dataDir, SEED_FILE: seedFile});

    const reply = await backfill(openStream, url, 237);

    expect(reply).to.deep.equal([]);
  });

  test("starts empty rather than seeded when DATA_DIR is empty", async ({
    dataDir,
    startServer,
    seedFile,
    openStream,
  }) => {
    const tree = path.join(dataDir, "tree");
    const {url} = await startServer(
      {DATA_DIR: "", SEED_FILE: seedFile},
      [],
      copyServer(tree),
    );

    const reply = await backfill(openStream, url, 237);

    expect(reply).to.deep.equal([]);
  });

  test("saves to data at the root of its tree when DATA_DIR is unset", async ({
    dataDir,
    startServer,
  }) => {
    const tree = path.join(dataDir, "tree");
    const {child, exited} = await startServer({}, [], copyServer(tree));

    child.kill("SIGTERM");
    await exited;

    expect(fs.existsSync(path.join(tree, "data", "buffer.json"))).to.equal(true);
  });

  test("saves no snapshot when DATA_DIR is empty", async ({dataDir, startServer}) => {
    const tree = path.join(dataDir, "tree");
    const {child, exited} = await startServer({DATA_DIR: ""}, [], copyServer(tree));

    child.kill("SIGTERM");
    await exited;

    expect(fs.globSync("**/buffer.json", {cwd: dataDir})).to.deep.equal([]);
  });
});
