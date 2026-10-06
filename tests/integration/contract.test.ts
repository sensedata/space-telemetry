// The surface the client in src/client/ depends on. The stream is read as unknown: these tests
// pin what the server sends, not what its types claim.

import http from "node:http";
import {describe, expect, vi} from "vitest";

import * as channels from "../../src/contract/channels.ts";
import {
  type CapturedRow,
  capturedRows,
} from "../../src/server/test-helpers/captured-rows.ts";
import {test} from "./test-helpers/connected-server.ts";
import {pickFields} from "./test-helpers/pick-fields.ts";

function nowSeconds() {
  return Math.trunc(Date.now() / 1000);
}

// The first row the capture holds of `item`.
function firstRow(item: string): CapturedRow {
  const [row] = capturedRows(item);
  if (row === undefined) {
    throw new RangeError(`the capture holds no row of ${item}`);
  }
  return row;
}

// The event names of a new stream's backfill from `serverUrl`, which leads with STATUS and
// ends with TIME_000001, the last carried channel after it.
async function backfillEventNames(serverUrl: string) {
  const response = await fetch(serverUrl + "/events");
  let text = "";
  const chunks = response.body?.pipeThrough(new TextDecoderStream()) ?? [];
  for await (const chunk of chunks) {
    text += chunk;
    if (/^event: 296$/m.test(text)) {
      break;
    }
  }
  return text
    .matchAll(/^event: (.*)$/gm)
    .map((match) => match[1])
    .toArray();
}

// The address of the page script the page at `serverUrl` names.
async function pageScript(serverUrl: string) {
  const response = await fetch(serverUrl + "/");
  const page = await response.text();
  const script = /<script [^>]*src="([^"]+)"/.exec(page)?.[1];
  if (script === undefined) {
    throw new Error(`the page at ${serverUrl} names no script`);
  }
  return serverUrl + script;
}

describe("backfill", () => {
  test("sends an event of each carried channel, STATUS first, and of no other channel", async ({
    serverUrl,
  }) => {
    const names = await backfillEventNames(serverUrl);

    expect(names).to.deep.equal([
      "297",
      ...channels.carried
        .filter((name) => name !== "STATUS")
        .map((name) => String(channels.numbers[name])),
    ]);
  });

  test("sends the records of the last 450 seconds in ascending time order", async ({
    feedRow,
    open,
  }) => {
    const now = nowSeconds();
    const [first, second, third] = capturedRows("USLAB000059");
    feedRow(third, now - 10);
    feedRow(first, now - 100);
    feedRow(second, now - 50);

    const reply = await open().next("237");

    expect(pickFields(reply, ["t"])).toStrictEqual([
      {t: now - 100},
      {t: now - 50},
      {t: now - 10},
    ]);
  });

  test("leaves out records older than 450 seconds", async ({feedRow, open}) => {
    const now = nowSeconds();
    const [older, newer] = capturedRows("USLAB000020");
    feedRow(older, now - 500);
    feedRow(newer, now - 400);

    const reply = await open().next("198");

    expect(pickFields(reply, ["t"])).toStrictEqual([{t: now - 400}]);
  });

  test("sends the single latest record when the last 450 seconds hold none", async ({
    feedRow,
    open,
  }) => {
    const now = nowSeconds();
    const [older, newer] = capturedRows("USLAB000043");
    feedRow(older, now - 1000);
    feedRow(newer, now - 900);

    const reply = await open().next("221");

    expect(pickFields(reply, ["t", "v"])).toStrictEqual([{t: now - 900, v: 0}]);
  });

  test("sends STATUS before TIME_000001", async ({open}) => {
    const stream = open();
    const order: string[] = [];

    const arrival = async (name: string) => {
      await stream.next(name);
      order.push(name);
    };

    await Promise.all([arrival("296"), arrival("297")]);

    expect(order).to.deep.equal(["297", "296"]);
  });

  // The live record on 237 follows the whole backfill, so every STATUS event of the
  // backfill has arrived by then.
  test("sends STATUS once in the backfill", async ({open, feedRow}) => {
    const stream = open();
    const statuses: string[] = [];
    stream.source.addEventListener("297", (event: MessageEvent<string>) => {
      statuses.push(event.data);
    });
    await stream.next("237");
    const live = stream.next("237");

    feedRow(capturedRows("USLAB000059")[0], nowSeconds());
    await live;

    expect(statuses).to.have.lengthOf(1);
  });

  test("sends records stored before the stream opened as backfill and later ones live, each once", async ({
    feedRow,
    open,
  }) => {
    const now = nowSeconds();
    const [first, second] = capturedRows("USLAB000059");
    feedRow(first, now - 3);
    const stream = open();
    const backfilled = await stream.next("237");
    const live = stream.next("237");

    feedRow(second, now - 2);

    expect([pickFields(backfilled, ["v"]), pickFields(await live, ["v"])]).toStrictEqual([
      [{v: 23.26046371459961}],
      [{v: 23.32332992553711}],
    ]);
  });

  // A page loaded before the server took no query still names its backfill in one.
  test("opens the stream whatever query the request carries", async ({serverUrl}) => {
    const response = await fetch(serverUrl + "/events?backfill=0,-450");
    await response.body?.cancel();

    expect([response.status, response.headers.get("content-type")]).to.deep.equal([
      200,
      "text/event-stream",
    ]);
  });
});

describe("event stream", () => {
  test("sends a ping event after 15 seconds, which the page and an idle proxy both see", async ({
    open,
  }) => {
    const stream = open();
    await stream.next("297");
    const ping = stream.next("ping");

    vi.advanceTimersByTime(15_000);

    expect(await ping).to.deep.equal({});
  });

  test("sends the stream with cache-control no-cache, which a proxy must not cache", async ({
    serverUrl,
  }) => {
    const response = await fetch(serverUrl + "/events");
    await response.body?.cancel();

    expect([response.status, response.headers.get("cache-control")]).to.deep.equal([
      200,
      "no-cache",
    ]);
  });
});

describe("record shape", () => {
  const anyRecord = Object.fromEntries(
    ["k", "v", "t", "s", "vm"].map((field) => [field, expect.anything()]),
  );

  test("sends backfill records with exactly the fields k, v, t, s, vm", async ({
    feedRow,
    open,
  }) => {
    feedRow(capturedRows("NODE3000009")[0], nowSeconds() - 10);

    const reply = await open().next("75");

    expect(reply).toStrictEqual([anyRecord]);
  });

  test("sends live records with exactly the fields k, v, t, s, vm", async ({
    open,
    feedRow,
  }) => {
    const stream = open();
    await stream.next("75");
    const message = stream.next("75");

    feedRow(capturedRows("NODE3000009")[0], nowSeconds());

    expect(await message).toStrictEqual([anyRecord]);
  });

  test("carries the channel number, value, unix time and status class of the feed update", async ({
    feedRow,
    open,
  }) => {
    const now = nowSeconds();
    const resend = capturedRows("NODE3000009")[2];
    feedRow(resend, now - 10);

    const reply = await open().next("75");

    expect(pickFields(reply, ["k", "v", "t", "s"])).toStrictEqual([
      {k: 75, v: 87.87999725341797, t: now - 10, s: 9},
    ]);
  });

  test("sends backfill records with vm, the mean of the values the channel holds", async ({
    feedRow,
    open,
  }) => {
    const now = nowSeconds();
    const [first, second, third, fourth] = capturedRows("USLAB000043");
    feedRow(first, now - 40);
    feedRow(second, now - 30);
    feedRow(third, now - 20);
    feedRow(fourth, now - 10);

    const reply = await open().next("221");

    expect(pickFields(reply, ["vm"])).toStrictEqual([
      {vm: 6.25},
      {vm: 6.25},
      {vm: 6.25},
      {vm: 6.25},
    ]);
  });

  test("sends live records with vm, the mean of the values the channel holds", async ({
    feedRow,
    open,
  }) => {
    const [held, live] = capturedRows("USLAB000043");
    feedRow(held, nowSeconds() - 10);
    const stream = open();
    await stream.next("221");
    const message = stream.next("221");

    feedRow(live, nowSeconds());

    expect(pickFields(await message, ["vm"])).toStrictEqual([{vm: 5}]);
  });

  test("sends vm as the mean of the numeric values when the feed sends an empty Value", async ({
    feedRow,
    open,
  }) => {
    const now = nowSeconds();
    const [first, second, , fourth] = capturedRows("USLAB000043");
    feedRow(first, now - 30);
    // Estimated: no captured row has an empty Value.
    feedRow(second && {...second, value: ""}, now - 20);
    feedRow(fourth, now - 10);

    const reply = await open().next("221");

    expect(pickFields(reply, ["vm"])).toStrictEqual([{vm: 7.5}, {vm: 7.5}, {vm: 7.5}]);
  });
});

describe("status channel", () => {
  // The server reports STATUS disconnected at boot, before the first TIME_000001.
  test("backfills STATUS ending connected while TIME_000001 is updating", async ({
    feedTime,
    open,
  }) => {
    feedTime();

    const status = await open().next("297");

    expect(pickFields(status, ["v", "s"])).toStrictEqual([
      {v: 0, s: 2},
      {v: 1, s: 24},
    ]);
  });

  test("backfills STATUS ending disconnected once TIME_000001 has stopped", async ({
    feedTime,
    open,
  }) => {
    feedTime();
    vi.advanceTimersByTime(10_000);

    const status = await open().next("297");

    expect(pickFields(status, ["v", "s"])).toStrictEqual([
      {v: 0, s: 2},
      {v: 1, s: 24},
      {v: 0, s: 2},
    ]);
  });

  test("sends STATUS disconnected to open streams after 10 seconds without TIME_000001", async ({
    feedTime,
    open,
  }) => {
    feedTime();
    const stream = open();
    await stream.next("297");
    const message = stream.next("297");

    vi.advanceTimersByTime(10_000);

    expect(pickFields(await message, ["k", "v", "s"])).toStrictEqual([
      {k: 297, v: 0, s: 2},
    ]);
  });

  test("sends STATUS connected to open streams when TIME_000001 resumes", async ({
    feedTime,
    open,
  }) => {
    feedTime();
    vi.advanceTimersByTime(10_000);
    const stream = open();
    await stream.next("297");
    const message = stream.next("297");

    feedTime();

    expect(pickFields(await message, ["v", "s"])).toStrictEqual([{v: 1, s: 24}]);
  });

  test("sends STATUS connected to open streams before the TIME_000001 record that resumed it", async ({
    feedTime,
    open,
  }) => {
    vi.advanceTimersByTime(10_000);
    const stream = open();
    await stream.next("296");
    const order: string[] = [];
    const arrival = async (name: string) => {
      await stream.next(name);
      order.push(name);
    };
    const arrivals = Promise.all([arrival("296"), arrival("297")]);

    feedTime();
    await arrivals;

    expect(order).to.deep.equal(["297", "296"]);
  });
});

describe("methods", () => {
  test.for([
    ["POST /", "POST", "/"],
    ["PUT /", "PUT", "/"],
    ["DELETE /", "DELETE", "/"],
    ["POST /events", "POST", "/events"],
  ] as const)(
    "answers %s with 405, allowing GET and HEAD",
    async ([, method, target], {serverUrl}) => {
      const response = await fetch(serverUrl + target, {method});

      expect([response.status, response.headers.get("allow")]).to.deep.equal([
        405,
        "GET, HEAD",
      ]);
    },
  );

  test("answers HEAD / with 200", async ({serverUrl}) => {
    const response = await fetch(serverUrl + "/", {method: "HEAD"});

    expect(response.status).to.equal(200);
  });
});

describe("static files", () => {
  test("serves / cacheable for five minutes", async ({serverUrl}) => {
    const response = await fetch(serverUrl + "/");

    expect([response.status, response.headers.get("cache-control")]).to.deep.equal([
      200,
      "public, max-age=300",
    ]);
  });

  test("serves the page script cacheable for five minutes", async ({serverUrl}) => {
    const response = await fetch(await pageScript(serverUrl));

    expect([response.status, response.headers.get("cache-control")]).to.deep.equal([
      200,
      "public, max-age=300",
    ]);
  });

  // fetch adds cache-control: no-cache to a conditional request, which forbids a 304, so
  // this request goes through http as a browser reload sends it.
  test("answers a conditional request with 304 and keeps serving", async ({
    serverUrl,
  }) => {
    const script = await pageScript(serverUrl);
    const first = await fetch(script);
    const conditional = await new Promise((resolve, reject) => {
      http
        .get(
          script,
          {
            headers: {"if-modified-since": first.headers.get("last-modified") ?? ""},
          },
          (response) => {
            response.resume();
            resolve(response.statusCode);
          },
        )
        .on("error", reject);
    });
    const again = await fetch(serverUrl + "/");

    expect([conditional, again.status]).to.deep.equal([304, 200]);
  });
});

describe("live fan-out", () => {
  test("sends an ingested record to every open stream as an event named by its channel number", async ({
    open,
    feedRow,
  }) => {
    const now = nowSeconds();
    const first = open();
    const second = open();
    await Promise.all([first.next("221"), second.next("221")]);
    const messages = Promise.all([first.next("221"), second.next("221")]);

    feedRow(capturedRows("USLAB000043")[1], now);

    const [toFirst, toSecond] = await messages;
    expect([
      pickFields(toFirst, ["k", "v", "t", "s"]),
      pickFields(toSecond, ["k", "v", "t", "s"]),
    ]).toStrictEqual([[{k: 221, v: 0, t: now, s: 24}], [{k: 221, v: 0, t: now, s: 24}]]);
  });

  // The adapter subscribes the carried channels alone, so a record of another reaches the
  // source only from another producer, as the replayer's recording holds every channel.
  // Streams get live records in the order they arrive, so one on 263 would come first.
  test("sends no live record of a channel it does not carry", async ({
    open,
    source,
    feedRow,
  }) => {
    const now = nowSeconds();
    const stream = open();
    await stream.next("237");
    const uncarried: string[] = [];
    stream.source.addEventListener("263", (event: MessageEvent<string>) => {
      uncarried.push(event.data);
    });
    const carried = stream.next("237");

    const row = firstRow("USLAB000085");
    source.emit("data", {
      k: 263,
      v: Number(row.value),
      cv: row.value_calibrated,
      t: now - 7,
      s: 24,
      sid: 1,
    });
    feedRow(capturedRows("USLAB000059")[0], now - 1);
    await carried;

    expect(uncarried).to.deep.equal([]);
  });

  test("does not send a resend of a record the server already holds", async ({
    open,
    feedRow,
  }) => {
    const now = nowSeconds();
    const [first, second] = capturedRows("USLAB000020");
    const stream = open();
    await stream.next("198");
    const original = stream.next("198");
    feedRow(first, now - 2);
    await original;
    const following = stream.next("198");

    feedRow(first, now - 2);
    feedRow(second, now - 1);

    expect(pickFields(await following, ["v"])).toStrictEqual([{v: -0.09021296352148056}]);
  });
});
