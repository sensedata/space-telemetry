// The surface the client in src/client/ depends on. The stream is read as unknown: these tests
// pin what the server sends, not what its types claim. The server sends live records a
// second at a time, so a test advances the clock a second before it awaits one.

import http, {type IncomingMessage, type OutgoingHttpHeaders} from "node:http";
import type {Readable} from "node:stream";
import zlib from "node:zlib";
import {describe, expect, vi} from "vitest";

import {
  type CapturedRow,
  capturedRows,
} from "../../src/server/test-helpers/captured-rows.ts";
import {test} from "./test-helpers/connected-server.ts";
import {recordsOfChannel} from "./test-helpers/event-stream.ts";
import {nowSeconds} from "./test-helpers/now-seconds.ts";
import {pickFields} from "./test-helpers/pick-fields.ts";

// The first row the capture holds of `item`.
function firstRow(item: string): CapturedRow {
  const [row] = capturedRows(item);
  if (row === undefined) {
    throw new RangeError(`the capture holds no row of ${item}`);
  }
  return row;
}

// Opens /events at `serverUrl` sending `headers`, as a client that reads the bytes on the
// wire; resolves once the response headers arrive.
function getEvents(serverUrl: string, headers: OutgoingHttpHeaders) {
  return new Promise<IncomingMessage>((resolve, reject) => {
    http.get(`${serverUrl}/events`, {headers}, resolve).on("error", reject);
  });
}

// The text `body` sends up to the end of its first event.
async function firstEvent(body: Readable) {
  let text = "";
  for await (const chunk of body.setEncoding("utf8")) {
    text += String(chunk);
    if (text.includes("\n\n")) {
      break;
    }
  }
  return text.slice(0, text.indexOf("\n\n") + 2);
}

// The channel of each record of a new stream's first event from `serverUrl`, in order.
async function backfillChannels(serverUrl: string) {
  const event = await firstEvent(await getEvents(serverUrl, {}));
  const data = /^data: (.*)$/m.exec(event)?.[1];
  if (data === undefined) {
    throw new Error(`the first event from ${serverUrl}/events carries no data`);
  }

  return pickFields(JSON.parse(data), ["k"]);
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

// A matcher of a record with exactly `fields`, each of any value but null or undefined.
function recordOf(...fields: string[]) {
  return Object.fromEntries(fields.map((field) => [field, expect.anything()]));
}

function lastModified(response: Response) {
  const modified = response.headers.get("last-modified");
  if (modified === null) {
    throw new Error(`${response.url} carries no last-modified`);
  }
  return modified;
}

describe("backfill", () => {
  // NODE3000009 and USLAB000059 sit between STATUS and TIME_000001 in the data dictionary.
  test("sends one records event of every channel's records, STATUS first then in dictionary order", async ({
    feedRow,
    serverUrl,
  }) => {
    const now = nowSeconds();
    feedRow(capturedRows("USLAB000059")[0], now - 10);
    feedRow(capturedRows("NODE3000009")[0], now - 5);

    const channels = await backfillChannels(serverUrl);

    expect(channels).toStrictEqual([
      {k: "STATUS"},
      {k: "STATUS"},
      {k: "NODE3000009"},
      {k: "USLAB000059"},
      {k: "TIME_000001"},
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

    const reply = await open().backfill("USLAB000059");

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

    const reply = await open().backfill("USLAB000020");

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

    const reply = await open().backfill("USLAB000043");

    expect(pickFields(reply, ["t", "v"])).toStrictEqual([{t: now - 900, v: 0}]);
  });

  test("sends records stored before the stream opened as backfill and later ones live, each once", async ({
    feedRow,
    open,
  }) => {
    const now = nowSeconds();
    const [first, second] = capturedRows("USLAB000059");
    feedRow(first, now - 3);
    const stream = open();
    const backfilled = await stream.backfill("USLAB000059");
    const live = stream.live("USLAB000059");

    feedRow(second, now - 2);
    vi.advanceTimersByTime(1000);

    expect([pickFields(backfilled, ["v"]), pickFields(await live, ["v"])]).toStrictEqual([
      [{v: 23.26}],
      [{v: 23.32}],
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
    await stream.backfill("STATUS");
    const ping = stream.next("ping");

    vi.advanceTimersByTime(15_000);

    expect(await ping).to.deep.equal({});
  });

  test("sends the stream with no-cache and no-transform, so a proxy neither caches nor recompresses it", async ({
    serverUrl,
  }) => {
    const response = await fetch(serverUrl + "/events");
    await response.body?.cancel();

    expect([response.status, response.headers.get("cache-control")]).to.deep.equal([
      200,
      "no-cache, no-transform",
    ]);
  });

  test.for([
    ["accept-encoding as curl --compressed sends it", "deflate, gzip"],
    ["gzip at weight 0.5", "br, gzip;q=0.5"],
  ] as const)(
    "gzips the stream for a client that sends %s and sends the backfill at once",
    async ([, acceptEncoding], {serverUrl}) => {
      const response = await getEvents(serverUrl, {"accept-encoding": acceptEncoding});
      const event = await firstEvent(response.pipe(zlib.createGunzip()));

      expect([
        response.headers["content-encoding"],
        event.split("\n", 1)[0],
      ]).to.deep.equal(["gzip", "event: records"]);
    },
  );

  test.for([
    ["no accept-encoding", {}],
    ["gzip at weight 0", {"accept-encoding": "gzip;q=0, deflate"}],
    ["only deflate and br", {"accept-encoding": "deflate, br"}],
  ] as const)(
    "sends the stream uncompressed to a client that sends %s",
    async ([, headers], {serverUrl}) => {
      const response = await getEvents(serverUrl, headers);
      const event = await firstEvent(response);

      expect([
        response.headers["content-encoding"],
        event.split("\n", 1)[0],
      ]).to.deep.equal([undefined, "event: records"]);
    },
  );
});

describe("record shape", () => {
  // No bullet chart marks NODE3000009 at its mean.
  test("sends backfill records of a channel the page marks at no mean with exactly the fields k, v, t, s", async ({
    feedRow,
    open,
  }) => {
    feedRow(capturedRows("NODE3000009")[0], nowSeconds() - 10);

    const reply = await open().backfill("NODE3000009");

    expect(reply).toStrictEqual([recordOf("k", "v", "t", "s")]);
  });

  test("sends live records of a channel the page marks at no mean with exactly the fields k, v, t, s", async ({
    open,
    feedRow,
  }) => {
    const stream = open();
    await stream.backfill("NODE3000009");
    const message = stream.live("NODE3000009");

    feedRow(capturedRows("NODE3000009")[0], nowSeconds());
    vi.advanceTimersByTime(1000);

    expect(await message).toStrictEqual([recordOf("k", "v", "t", "s")]);
  });

  // A bullet chart marks Z1000005 at its mean.
  test("sends backfill records of a channel the page marks at its mean with exactly the fields k, v, t, s, vm", async ({
    feedRow,
    open,
  }) => {
    feedRow(capturedRows("Z1000005")[0], nowSeconds() - 10);

    const reply = await open().backfill("Z1000005");

    expect(reply).toStrictEqual([recordOf("k", "v", "t", "s", "vm")]);
  });

  test("sends live records of a channel the page marks at its mean with exactly the fields k, v, t, s, vm", async ({
    open,
    feedRow,
  }) => {
    const stream = open();
    await stream.backfill("Z1000005");
    const message = stream.live("Z1000005");

    feedRow(capturedRows("Z1000005")[0], nowSeconds());
    vi.advanceTimersByTime(1000);

    expect(await message).toStrictEqual([recordOf("k", "v", "t", "s", "vm")]);
  });

  test("carries the channel name, value at the decimals the page needs, unix time and status class of the feed update", async ({
    feedRow,
    open,
  }) => {
    const now = nowSeconds();
    const resend = capturedRows("NODE3000009")[2];
    feedRow(resend, now - 10);

    const reply = await open().backfill("NODE3000009");

    expect(pickFields(reply, ["k", "v", "t", "s"])).toStrictEqual([
      {k: "NODE3000009", v: 87.88, t: now - 10, s: 9},
    ]);
  });

  // index.html shows Z1000005 at data-scale="3".
  test("sends backfill records with vm, the mean of the values the channel holds at the decimals the page needs", async ({
    feedRow,
    open,
  }) => {
    const now = nowSeconds();
    const [first, second, third, fourth] = capturedRows("Z1000005");
    feedRow(first, now - 40);
    feedRow(second, now - 30);
    feedRow(third, now - 20);
    feedRow(fourth, now - 10);

    const reply = await open().backfill("Z1000005");

    expect(pickFields(reply, ["vm"])).toStrictEqual([
      {vm: 0.664},
      {vm: 0.664},
      {vm: 0.664},
      {vm: 0.664},
    ]);
  });

  test("sends live records with vm, the mean of the values the channel holds at the decimals the page needs", async ({
    feedRow,
    open,
  }) => {
    const [held, live] = capturedRows("Z1000005");
    feedRow(held, nowSeconds() - 10);
    const stream = open();
    await stream.backfill("Z1000005");
    const message = stream.live("Z1000005");

    feedRow(live, nowSeconds());
    vi.advanceTimersByTime(1000);

    expect(pickFields(await message, ["vm"])).toStrictEqual([{vm: 0.667}]);
  });

  test("sends vm as the mean of the numeric values when the feed sends an empty Value", async ({
    feedRow,
    open,
  }) => {
    const now = nowSeconds();
    const [first, second, third] = capturedRows("Z1000005");
    feedRow(first, now - 30);
    // Estimated: no captured row has an empty Value.
    feedRow(second && {...second, value: ""}, now - 20);
    feedRow(third, now - 10);

    const reply = await open().backfill("Z1000005");

    expect(pickFields(reply, ["vm"])).toStrictEqual([
      {vm: 0.663},
      {vm: 0.663},
      {vm: 0.663},
    ]);
  });
});

describe("status channel", () => {
  // The server reports STATUS disconnected at boot, before the first TIME_000001.
  test("backfills STATUS ending connected while TIME_000001 is updating", async ({
    feedTime,
    open,
  }) => {
    feedTime();

    const status = await open().backfill("STATUS");

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

    const status = await open().backfill("STATUS");

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
    await stream.backfill("STATUS");
    const message = stream.live("STATUS");

    vi.advanceTimersByTime(10_000);
    vi.advanceTimersByTime(1000);

    expect(pickFields(await message, ["k", "v", "s"])).toStrictEqual([
      {k: "STATUS", v: 0, s: 2},
    ]);
  });

  test("sends STATUS connected to open streams when TIME_000001 resumes", async ({
    feedTime,
    open,
  }) => {
    feedTime();
    vi.advanceTimersByTime(10_000);
    const stream = open();
    await stream.backfill("STATUS");
    const message = stream.live("STATUS");

    feedTime();
    vi.advanceTimersByTime(1000);

    expect(pickFields(await message, ["v", "s"])).toStrictEqual([{v: 1, s: 24}]);
  });

  test("sends STATUS connected to open streams before the TIME_000001 record that resumed it", async ({
    feedTime,
    open,
  }) => {
    vi.advanceTimersByTime(10_000);
    const stream = open();
    await stream.backfill("TIME_000001");
    const order: string[] = [];
    const arrival = async (channel: string) => {
      await stream.live(channel);
      order.push(channel);
    };
    const arrivals = Promise.all([arrival("TIME_000001"), arrival("STATUS")]);

    feedTime();
    vi.advanceTimersByTime(1000);
    await arrivals;

    expect(order).to.deep.equal(["STATUS", "TIME_000001"]);
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
      await response.body?.cancel();

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
    await response.body?.cancel();

    expect([response.status, response.headers.get("cache-control")]).to.deep.equal([
      200,
      "public, max-age=300",
    ]);
  });

  test("serves the page script cacheable for five minutes", async ({serverUrl}) => {
    const response = await fetch(await pageScript(serverUrl));
    await response.body?.cancel();

    expect([response.status, response.headers.get("cache-control")]).to.deep.equal([
      200,
      "public, max-age=300",
    ]);
  });

  test("answers a conditional request with 304 and keeps serving", async ({
    serverUrl,
  }) => {
    const script = await pageScript(serverUrl);
    const first = await fetch(script);
    await first.body?.cancel();
    const conditional = await fetch(script, {
      headers: {"if-modified-since": lastModified(first)},
    });
    const again = await fetch(serverUrl + "/");
    await again.body?.cancel();

    expect([conditional.status, again.status]).to.deep.equal([304, 200]);
  });
});

describe("live fan-out", () => {
  test("sends an ingested record to every open stream as a records event", async ({
    open,
    feedRow,
  }) => {
    const now = nowSeconds();
    const first = open();
    const second = open();
    await Promise.all([first.backfill("USLAB000043"), second.backfill("USLAB000043")]);
    const messages = Promise.all([first.live("USLAB000043"), second.live("USLAB000043")]);

    feedRow(capturedRows("USLAB000043")[1], now);
    vi.advanceTimersByTime(1000);

    const [toFirst, toSecond] = await messages;
    expect([
      pickFields(toFirst, ["k", "v", "t", "s"]),
      pickFields(toSecond, ["k", "v", "t", "s"]),
    ]).toStrictEqual([
      [{k: "USLAB000043", v: 0, t: now, s: 24}],
      [{k: "USLAB000043", v: 0, t: now, s: 24}],
    ]);
  });

  // The adapter subscribes the carried channels alone, so a record of another reaches the
  // source only from another producer, as the replayer's recording holds every channel.
  // Streams get live records in the order they arrive, so one of USLAB000085 would come
  // first.
  test("sends no live record of a channel it does not carry", async ({
    open,
    source,
    feedRow,
  }) => {
    const now = nowSeconds();
    const stream = open();
    await stream.backfill("USLAB000059");
    const uncarried: unknown[] = [];
    stream.source.addEventListener("records", (event: MessageEvent<string>) => {
      uncarried.push(...recordsOfChannel(JSON.parse(event.data), "USLAB000085"));
    });
    const carried = stream.live("USLAB000059");

    const row = firstRow("USLAB000085");
    source.emit("data", {
      k: "USLAB000085",
      v: Number(row.value),
      cv: row.value_calibrated,
      t: now - 7,
      s: 24,
      sid: 1,
    });
    feedRow(capturedRows("USLAB000059")[0], now - 1);
    vi.advanceTimersByTime(1000);
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
    await stream.backfill("USLAB000020");
    const original = stream.live("USLAB000020");
    feedRow(first, now - 2);
    vi.advanceTimersByTime(1000);
    await original;
    const following = stream.live("USLAB000020");

    feedRow(first, now - 2);
    feedRow(second, now - 1);
    vi.advanceTimersByTime(1000);

    expect(pickFields(await following, ["v"])).toStrictEqual([{v: -0.090213}]);
  });
});
