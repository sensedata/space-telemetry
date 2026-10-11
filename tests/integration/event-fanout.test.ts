import {once} from "node:events";
import http, {type IncomingMessage, type ServerResponse} from "node:http";
import {type Readable, Writable} from "node:stream";
import zlib from "node:zlib";
import {describe, expect, vi} from "vitest";

import {createEventFanout, type EventFanout} from "../../src/server/event-fanout.ts";
import {listeningPort} from "../../src/server/listening-port.ts";
import contract from "../../src/server/test-helpers/contract-rows.json" with {
  type: "json",
};
import {test} from "./test-helpers/listening-server.ts";

const MB = 1024 * 1024;

// Serves one stream from `server` and `fanout` that starts with `initial`, gzipped when
// `gzip`; resolves with the server's response once it is added.
async function serveStream(
  server: http.Server,
  fanout: EventFanout,
  initial: string,
  gzip: boolean,
) {
  const added = new Promise<ServerResponse>((resolve) =>
    server.once("request", (_req, res) => {
      res.writeHead(200, {"Content-Type": "text/event-stream"});
      res.flushHeaders();
      fanout.add(res, initial, gzip);
      resolve(res);
    }),
  );
  const response = new Promise<IncomingMessage>((resolve) => {
    // By address: resolving localhost can stall for a test's whole timeout.
    http.get(`http://127.0.0.1:${listeningPort(server)}/`, resolve).on("error", () => {
      // The server end closes every stream, at teardown or on falling behind, which the
      // client reports as a hang-up.
    });
  });
  return {res: await added, response};
}

function openStream(server: http.Server, fanout: EventFanout, initial: string) {
  return serveStream(server, fanout, initial, false);
}

// A gzipped stream from `server` and `fanout` that starts with `initial`, decoded by a
// stock gunzip.
async function openGzipStream(server: http.Server, fanout: EventFanout, initial: string) {
  const {response} = await serveStream(server, fanout, initial, true);
  const gzipped = await response;
  return gzipped.pipe(zlib.createGunzip());
}

// The bytes a gzip response with an empty backfill takes for `seconds`, each the events
// appended within one second.
function gzippedLength(seconds: readonly string[]) {
  const fanout = createEventFanout(8);
  let length = 0;
  const res = new Writable({
    write(chunk: Buffer, _encoding, done) {
      length += chunk.length;
      done();
    },
  });
  fanout.add(res, "", true);
  for (const events of seconds) {
    fanout.append(events);
    vi.advanceTimersByTime(1000);
  }
  return length;
}

function frame(name: string, size: number) {
  return `event: ${name}\ndata: ${"x".repeat(size)}\n\n`;
}

// Appends `count` events of `size` bytes, one a second, named 1 up to `count` in order.
function appendFrames(fanout: EventFanout, count: number, size: number) {
  for (let n = 1; n <= count; n++) {
    fanout.append(frame(String(n), size));
    vi.advanceTimersByTime(1000);
  }
}

async function eventNames(body: Readable, count: number) {
  body.setEncoding("utf8");
  let text = "";
  for await (const chunk of body) {
    text += String(chunk);
    if (text.split("\n\n").length > count) {
      break;
    }
  }
  return text
    .matchAll(/^event: (.*)$/gm)
    .map((match) => match[1])
    .toArray();
}

describe("an event fan-out", () => {
  test("sends a connection the events in the order they were appended", async ({
    server,
  }) => {
    const fanout = createEventFanout(8);
    const {response} = await openStream(server, fanout, "");

    fanout.append(frame("297", 1));
    fanout.append(frame("296", 1));
    fanout.append(frame("40", 1));
    vi.advanceTimersByTime(1000);

    expect(await eventNames(await response, 3)).to.deep.equal(["297", "296", "40"]);
  });

  test("holds at most one second's events for a connection that stops reading", async ({
    server,
  }) => {
    const fanout = createEventFanout(32);
    const {res} = await openStream(server, fanout, "");

    appendFrames(fanout, 20, MB);

    expect(res.writableLength).to.be.at.most(MB + 1024);
  });

  test("sends every held event once a stopped connection reads again", async ({
    server,
  }) => {
    const fanout = createEventFanout(32);
    const {response} = await openStream(server, fanout, "");
    appendFrames(fanout, 20, MB);

    expect(await eventNames(await response, 20)).to.deep.equal([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19",
      "20",
    ]);
  });

  test("closes a connection that falls behind the oldest second it holds", async ({
    server,
  }) => {
    const fanout = createEventFanout(4);
    const {res} = await openStream(server, fanout, "");
    const closed = once(res, "close");

    appendFrames(fanout, 10, MB);
    await closed;

    expect(res.destroyed).toBe(true);
  });

  test("counts a connection's lag in seconds, not events", async ({server}) => {
    const fanout = createEventFanout(2);
    const {res} = await openStream(server, fanout, frame("297", 2 * MB));

    fanout.append(frame("1", 1));
    fanout.append(frame("2", 1));
    vi.advanceTimersByTime(1000);
    fanout.append(frame("3", 1));
    fanout.append(frame("4", 1));
    vi.advanceTimersByTime(1000);

    expect(res.destroyed).toBe(false);
  });

  test("sends a connection its initial backfill before the events appended after it", async ({
    server,
  }) => {
    const fanout = createEventFanout(8);
    const {response} = await openStream(server, fanout, frame("297", 1) + frame("40", 1));

    fanout.append(frame("40", 1));
    vi.advanceTimersByTime(1000);

    expect(await eventNames(await response, 3)).to.deep.equal(["297", "40", "40"]);
  });

  test("sends a connection that joins mid-second only the events appended after it joined", async ({
    server,
  }) => {
    const fanout = createEventFanout(8);
    fanout.append(frame("1", 1));
    const {response} = await openStream(server, fanout, frame("backfill", 1));

    fanout.append(frame("2", 1));
    vi.advanceTimersByTime(1000);

    expect(await eventNames(await response, 2)).to.deep.equal(["backfill", "2"]);
  });

  test("holds no event behind an initial backfill a connection does not read", async ({
    server,
  }) => {
    const fanout = createEventFanout(32);
    const {res} = await openStream(server, fanout, frame("297", 2 * MB));

    appendFrames(fanout, 5, MB);

    expect(res.writableLength).to.be.at.most(2 * MB + 1024);
  });

  test("sends a ping event every 15 seconds", async ({server}) => {
    const fanout = createEventFanout(8);
    const {response} = await openStream(server, fanout, "");

    vi.advanceTimersByTime(15_000);

    expect(await eventNames(await response, 1)).to.deep.equal(["ping"]);
  });

  test("skips the ping of a connection that waits to drain", async ({server}) => {
    const fanout = createEventFanout(8);
    const {res} = await openStream(server, fanout, "");
    fanout.append(frame("1", MB));
    vi.advanceTimersByTime(1000);
    const held = res.writableLength;

    vi.advanceTimersByTime(15_000);

    expect(res.writableLength).to.equal(held);
  });

  test("stops pinging a connection once it closes", async ({server}) => {
    const fanout = createEventFanout(8);
    const {res} = await openStream(server, fanout, "");
    const closed = once(res, "close");

    server.closeAllConnections();
    await closed;

    expect(vi.getTimerCount()).to.equal(0);
  });

  test("adds no listener to a connection once it closes", async ({server}) => {
    const fanout = createEventFanout(8);
    const {res} = await openStream(server, fanout, "");
    const closed = once(res, "close");
    server.closeAllConnections();
    await closed;

    fanout.append(frame("1", 1));
    vi.advanceTimersByTime(1000);

    expect(res.listenerCount("drain")).to.equal(0);
  });
});

describe("an event fan-out to a gzip connection", () => {
  test("sends its initial backfill and each second's events as one gzip stream", async ({
    server,
  }) => {
    const fanout = createEventFanout(8);
    const text = await openGzipStream(server, fanout, frame("297", 1));

    fanout.append(frame("40", 64));
    vi.advanceTimersByTime(1000);
    fanout.append(frame("40", 64));
    vi.advanceTimersByTime(1000);

    expect(await eventNames(text, 3)).to.deep.equal(["297", "40", "40"]);
  });

  test("sends a repeat of the last second's events in under a tenth of the bytes they first took", () => {
    const second = `event: records\ndata: ${JSON.stringify(contract.groups)}\n\n`;

    const oneSecond = gzippedLength([second]);
    const twoSeconds = gzippedLength([second, second]);

    expect(twoSeconds - oneSecond).to.be.below(oneSecond / 10);
  });

  test("sends the events of the seconds after a ping", async ({server}) => {
    const fanout = createEventFanout(8);
    const text = await openGzipStream(server, fanout, "");

    fanout.append(frame("1", 64));
    vi.advanceTimersByTime(15_000);
    fanout.append(frame("1", 64));
    vi.advanceTimersByTime(1000);

    expect(await eventNames(text, 3)).to.deep.equal(["1", "ping", "1"]);
  });

  test("sends one that joins between seconds each second after it joined", async ({
    server,
  }) => {
    const fanout = createEventFanout(8);
    fanout.append(frame("1", 64));
    vi.advanceTimersByTime(1000);
    const text = await openGzipStream(server, fanout, frame("backfill", 1));

    fanout.append(frame("1", 64));
    vi.advanceTimersByTime(1000);

    expect(await eventNames(text, 2)).to.deep.equal(["backfill", "1"]);
  });

  test("sends one that joins mid-second the rest of that second, then each second after", async ({
    server,
  }) => {
    const fanout = createEventFanout(8);
    fanout.append(frame("1", 64));
    const text = await openGzipStream(server, fanout, frame("backfill", 1));

    fanout.append(frame("2", 64));
    vi.advanceTimersByTime(1000);
    fanout.append(frame("1", 64));
    fanout.append(frame("2", 64));
    vi.advanceTimersByTime(1000);

    expect(await eventNames(text, 4)).to.deep.equal(["backfill", "2", "1", "2"]);
  });
});
