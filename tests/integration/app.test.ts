import type {RequestListener} from "node:http";

import {assert, describe, vi} from "vitest";
import type {Store} from "../../src/client/stores/store.ts";
import {streamRecord, timedRecord} from "../../src/client/test-helpers/records.ts";
import type {StreamRecord} from "../../src/contract/stream-record.ts";
import {test} from "./test-helpers/app.ts";

function changed(store: Pick<Store<object>, "subscribe">): Promise<void> {
  return new Promise((resolve) => store.subscribe(resolve));
}

// Answers the first request 503, and each later one with a stream that sends `records` as an
// event of channel 0.
function unavailableOnce(records: readonly StreamRecord[]): RequestListener {
  let requests = 0;
  return (_req, res) => {
    requests += 1;
    if (requests === 1) {
      res.writeHead(503).end();
      return;
    }
    res.writeHead(200, {"Content-Type": "text/event-stream"});
    res.write(`event: 0\ndata: ${JSON.stringify(records)}\n\n`);
  };
}

describe("App against a server", () => {
  test("refuses a subscription made after it connects, when the stream has sent its history", async ({
    serveApp,
  }) => {
    const app = await serveApp((_req, res) =>
      res.writeHead(200, {"Content-Type": "text/event-stream"}),
    );
    app.connect();

    assert.throws(
      () => app.getSimpleStore("AIRLOCK000001"),
      Error,
      /after the event stream opened and sent its history/,
    );
  });

  test("reopens the stream after the server answers 503", async ({serveApp}) => {
    vi.useFakeTimers({toFake: ["setTimeout", "clearTimeout"]});
    const app = await serveApp(
      unavailableOnce([streamRecord({k: 0, v: 7, t: 1_790_560_000, s: 24})]),
    );
    const store = app.getSimpleStore("AIRLOCK000001");
    app.connect();
    await changed(app.connection);

    vi.advanceTimersByTime(1000);
    await changed(store);

    assert.deepEqual(store.get(), [timedRecord({k: 0, v: 7, t: 1_790_560_000, s: 24})]);
  });

  test("reports the stream lost while it reconnects and found once it reopens", async ({
    serveApp,
  }) => {
    // Ends every stream at once and has EventSource reopen it after 10 ms.
    const app = await serveApp((_req, res) => {
      res.writeHead(200, {"Content-Type": "text/event-stream"}).end("retry: 10\n\n");
    });
    const states: boolean[] = [];
    const reopened = new Promise<void>((resolve) =>
      app.connection.subscribe(() => {
        states.push(app.connection.get());
        if (states.length === 3) {
          resolve();
        }
      }),
    );

    app.connect();
    await reopened;

    assert.deepEqual(states, [false, true, false]);
  });
});

describe("App's reconnection timing", () => {
  test.override({now: 0});

  test("waits 1, 2 and 4 seconds between reopens after refusals, and 1 again after an open", ({
    app,
    sourceAt,
    sources,
  }) => {
    app.connect();
    sourceAt(0).refuse();
    vi.advanceTimersByTime(1000);
    sourceAt(1).refuse();
    vi.advanceTimersByTime(2000);
    sourceAt(2).refuse();
    vi.advanceTimersByTime(4000);
    sourceAt(3).open();
    sourceAt(3).refuse();
    vi.advanceTimersByTime(1000);

    assert.deepEqual(
      sources.map((source) => source.openedAt),
      [0, 1000, 3000, 7000, 8000],
    );
  });

  test("reopens a stream that carries nothing, not even a ping, for 30 seconds", ({
    app,
    sourceAt,
    sources,
  }) => {
    app.connect();
    sourceAt(0).open();

    vi.advanceTimersByTime(30_000);
    vi.advanceTimersByTime(1000);

    assert.deepEqual([sourceAt(0).readyState, sources.length], [EventSource.CLOSED, 2]);
  });

  test("keeps a stream that sends a ping within every 30 seconds", ({
    app,
    sourceAt,
    sources,
  }) => {
    app.connect();
    sourceAt(0).open();

    vi.advanceTimersByTime(20_000);
    sourceAt(0).send({name: "ping", data: {}});
    vi.advanceTimersByTime(20_000);

    assert.deepEqual([sourceAt(0).readyState, sources.length], [1, 1]);
  });

  test("reopens a stream that never opens within 30 seconds", ({app, sources}) => {
    app.connect();
    vi.advanceTimersByTime(31_000);

    assert.equal(sources.length, 2);
  });

  test("stops the watchdog once closed", ({app, sourceAt, sources}) => {
    app.connect();
    sourceAt(0).open();

    app.close();
    vi.advanceTimersByTime(31_000);

    assert.equal(sources.length, 1);
  });

  test("stops reopening once closed", ({app, sourceAt, sources}) => {
    app.connect();
    sourceAt(0).refuse();

    app.close();
    vi.advanceTimersByTime(1000);

    assert.equal(sources.length, 1);
  });

  test("closes its stream once closed", ({app, sourceAt}) => {
    app.connect();
    sourceAt(0).open();

    app.close();

    assert.equal(sourceAt(0).readyState, EventSource.CLOSED);
  });

  test("reports the stream lost once it falls silent for 30 seconds", ({
    app,
    sourceAt,
  }) => {
    app.connect();
    sourceAt(0).open();

    vi.advanceTimersByTime(30_000);

    assert.isTrue(app.connection.get());
  });

  test("counts the 30 seconds of silence from a late open", ({
    app,
    sourceAt,
    sources,
  }) => {
    app.connect();
    vi.advanceTimersByTime(20_000);
    sourceAt(0).open();
    vi.advanceTimersByTime(20_000);

    assert.equal(sources.length, 1);
  });

  test("reopens a stream refused late in its 30 seconds of silence once", ({
    app,
    sourceAt,
    sources,
  }) => {
    app.connect();
    vi.advanceTimersByTime(29_500);
    sourceAt(0).refuse();
    vi.advanceTimersByTime(3000);

    assert.deepEqual(
      sources.map((source) => source.openedAt),
      [0, 30_500],
    );
  });

  test("leaves a dropped stream to reconnect by itself", ({app, sourceAt, sources}) => {
    app.connect();
    sourceAt(0).open();
    sourceAt(0).drop();
    vi.advanceTimersByTime(1000);

    assert.equal(sources.length, 1);
  });
});

describe("App's silence watchdog on a subscribed channel", () => {
  test("keeps a stream that sends the channel's records within every 30 seconds", ({
    app,
    sourceAt,
    sources,
  }) => {
    app.getSimpleStore("AIRLOCK000001");
    app.connect();
    sourceAt(0).open();

    vi.advanceTimersByTime(20_000);
    sourceAt(0).send({
      name: "0",
      data: [streamRecord({k: 0, v: 1, t: 1_790_560_000, s: 24})],
    });
    vi.advanceTimersByTime(20_000);

    assert.deepEqual([sourceAt(0).readyState, sources.length], [1, 1]);
  });
});

describe("App's stores fed by the stream", () => {
  test("keeps the latest 150 points of a single channel's chart", ({app, sourceAt}) => {
    const store = app.getSimpleStore("AIRLOCK000001");
    app.connect();
    const records = Array.from({length: 200}, (_, n) =>
      streamRecord({k: 0, v: 1, t: 1_790_560_000 + n, s: 24}),
    );

    sourceAt(0).send({name: "0", data: records});

    const kept = store.get();
    assert.deepEqual(
      [kept.length, kept[0]?.t, kept[149]?.t],
      [150, 1_790_560_050, 1_790_560_199],
    );
  });

  test("keeps the latest 150 points of a combined chart, as of a single channel's", ({
    app,
    sourceAt,
  }) => {
    const store = app.getSummingStore(["AIRLOCK000001", "AIRLOCK000003"]);
    app.connect();
    const records = Array.from({length: 200}, (_, n) =>
      streamRecord({k: 0, v: 1, t: 1_790_560_000 + n, s: 24}),
    );

    sourceAt(0).send({name: "0", data: records});

    const kept = store.get();
    assert.deepEqual(
      [kept.length, kept[0]?.t, kept[149]?.t],
      [150, 1_790_560_050, 1_790_560_199],
    );
  });

  test("keeps the sum and the average of the same channels apart", ({app, sourceAt}) => {
    const sum = app.getSummingStore(["AIRLOCK000001", "AIRLOCK000003"]);
    const average = app.getAveragingStore(["AIRLOCK000001", "AIRLOCK000003"]);
    app.connect();

    sourceAt(0).send({
      name: "0",
      data: [streamRecord({k: 0, v: 2, t: 1_790_560_000, s: 24})],
    });
    sourceAt(0).send({
      name: "2",
      data: [streamRecord({k: 2, v: 4, t: 1_790_560_000, s: 24})],
    });

    assert.deepEqual([sum.get().at(-1)?.v, average.get().at(-1)?.v], [6, 3]);
  });

  test("gives a deviation cell its channels' largest distance from their mean", ({
    app,
    sourceAt,
  }) => {
    const deviation = app.getDeviationStore(["AIRLOCK000001", "AIRLOCK000003"]);
    app.connect();

    sourceAt(0).send({
      name: "0",
      data: [streamRecord({k: 0, v: 160, t: 1_790_560_000, s: 24})],
    });
    sourceAt(0).send({
      name: "2",
      data: [streamRecord({k: 2, v: 150, t: 1_790_560_000, s: 24})],
    });

    assert.equal(deviation.get().at(-1)?.v, 5);
  });

  test("gives an angle deviation cell its mirrored angles' largest distance from their mean", ({
    app,
    sourceAt,
  }) => {
    const deviation = app.getAngleDeviationStore([
      {channel: "S4000007", negated: false, turned: false},
      {channel: "S4000008", negated: true, turned: false},
    ]);
    app.connect();

    sourceAt(0).send({
      name: "169",
      data: [streamRecord({k: 169, v: 20, t: 1_790_560_000, s: 24})],
    });
    sourceAt(0).send({
      name: "170",
      data: [streamRecord({k: 170, v: 330, t: 1_790_560_000, s: 24})],
    });

    assert.closeTo(deviation.get().at(-1)?.v ?? NaN, 5, 1e-9);
  });

  test("gives a power cell the watts of its volts and amps", ({app, sourceAt}) => {
    const power = app.getPowerStore([{volts: "AIRLOCK000001", amps: "AIRLOCK000002"}]);
    app.connect();

    sourceAt(0).send({
      name: "0",
      data: [streamRecord({k: 0, v: 18, t: 1_790_560_000, s: 24})],
    });
    sourceAt(0).send({
      name: "1",
      data: [streamRecord({k: 1, v: 4, t: 1_790_560_000, s: 24})],
    });

    assert.equal(power.get().at(-1)?.v, 72);
  });

  test("gives every status of a channel its newest record", ({app, sourceAt}) => {
    app.getLatestStore("USLAB000042");
    const second = app.getLatestStore("USLAB000042");
    app.connect();

    sourceAt(0).send({
      name: "220",
      data: [streamRecord({k: 220, v: 1, t: 1_790_560_000, s: 24})],
    });

    assert.deepEqual(second.get(), [
      timedRecord({k: 220, v: 1, t: 1_790_560_000, s: 24}),
    ]);
  });

  test("refuses a quaternion named as a channel it already holds a chart of", ({app}) => {
    app.getSimpleStore("AIRLOCK000001");

    assert.throws(
      () =>
        app.getQuaternionStore("AIRLOCK000001", {
          x: "USLAB000019",
          y: "USLAB000020",
          z: "USLAB000021",
          w: "USLAB000018",
        }),
      Error,
      /AIRLOCK000001/,
    );
  });
});
