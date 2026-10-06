import {once} from "node:events";
import http, {type IncomingMessage, type ServerResponse} from "node:http";
import {describe, expect, vi} from "vitest";

import {createEventFanout, type EventFanout} from "../../src/server/event-fanout.ts";
import {listeningPort} from "../../src/server/listening-port.ts";
import {test} from "./test-helpers/listening-server.ts";

const MB = 1024 * 1024;

// Serves one stream from `server` and `fanout` that starts with `initial`; resolves with the
// server's response once it is added.
async function openStream(server: http.Server, fanout: EventFanout, initial: string) {
  const added = new Promise<ServerResponse>((resolve) =>
    server.once("request", (_req, res) => {
      res.writeHead(200, {"Content-Type": "text/event-stream"});
      res.flushHeaders();
      fanout.add(res, initial);
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

function frame(name: string, size: number) {
  return `event: ${name}\ndata: ${"x".repeat(size)}\n\n`;
}

// Appends `count` events of `size` bytes, named 1 up to `count` in order.
function appendFrames(fanout: EventFanout, count: number, size: number) {
  for (let n = 1; n <= count; n++) {
    fanout.append(frame(String(n), size));
  }
}

async function eventNames(response: IncomingMessage, count: number) {
  response.setEncoding("utf8");
  let text = "";
  for await (const chunk of response) {
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

describe("event fan-out", () => {
  test("sends a connection the events in the order they were appended", async ({
    server,
  }) => {
    const fanout = createEventFanout(8);
    const {response} = await openStream(server, fanout, "");

    fanout.append(frame("297", 1));
    fanout.append(frame("296", 1));
    fanout.append(frame("40", 1));

    expect(await eventNames(await response, 3)).to.deep.equal(["297", "296", "40"]);
  });

  test("holds at most one event for a connection that stops reading", async ({
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

  test("closes and drops a connection that falls behind the oldest event it holds", async ({
    server,
  }) => {
    const fanout = createEventFanout(4);
    const {res} = await openStream(server, fanout, "");
    const closed = once(res, "close");

    appendFrames(fanout, 10, MB);
    await closed;

    expect([res.destroyed, fanout.size]).to.deep.equal([true, 0]);
  });

  test("sends a connection its initial backfill before the events appended after it", async ({
    server,
  }) => {
    const fanout = createEventFanout(8);
    const {response} = await openStream(server, fanout, frame("297", 1) + frame("40", 1));

    fanout.append(frame("40", 1));

    expect(await eventNames(await response, 3)).to.deep.equal(["297", "40", "40"]);
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
});
