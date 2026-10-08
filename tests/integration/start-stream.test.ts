import {assert, describe, vi} from "vitest";
import {recordsOf} from "../../src/client/cell-source.ts";
import {streamRecord} from "../../src/client/test-helpers/records.ts";
import {test} from "./test-helpers/start-stream.ts";

describe("the stream's reconnection timing", () => {
  test.override({now: 0});

  test("waits 1, 2 and 4 seconds between reopens after refusals, and 1 again after an open", ({
    sourceAt,
    sources,
  }) => {
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
    sourceAt,
    sources,
  }) => {
    sourceAt(0).open();

    vi.advanceTimersByTime(30_000);
    vi.advanceTimersByTime(1000);

    assert.deepEqual([sourceAt(0).readyState, sources.length], [EventSource.CLOSED, 2]);
  });

  test("keeps a stream that sends a ping within every 30 seconds", ({
    sourceAt,
    sources,
  }) => {
    sourceAt(0).open();

    vi.advanceTimersByTime(20_000);
    sourceAt(0).send({name: "ping", data: {}});
    vi.advanceTimersByTime(20_000);

    assert.deepEqual([sourceAt(0).readyState, sources.length], [1, 1]);
  });

  test("reopens a stream that never opens within 30 seconds", ({sources}) => {
    vi.advanceTimersByTime(31_000);

    assert.equal(sources.length, 2);
  });

  test("stops the watchdog once closed", ({stream, sourceAt, sources}) => {
    sourceAt(0).open();

    stream.close();
    vi.advanceTimersByTime(31_000);

    assert.equal(sources.length, 1);
  });

  test("stops reopening once closed", ({stream, sourceAt, sources}) => {
    sourceAt(0).refuse();

    stream.close();
    vi.advanceTimersByTime(1000);

    assert.equal(sources.length, 1);
  });

  test("closes its stream once closed", ({stream, sourceAt}) => {
    sourceAt(0).open();

    stream.close();

    assert.equal(sourceAt(0).readyState, EventSource.CLOSED);
  });

  test("reports the stream lost once it falls silent for 30 seconds", ({
    stream,
    sourceAt,
  }) => {
    sourceAt(0).open();

    vi.advanceTimersByTime(30_000);

    assert.isTrue(stream.connection.get());
  });

  test("counts the 30 seconds of silence from a late open", ({sourceAt, sources}) => {
    vi.advanceTimersByTime(20_000);
    sourceAt(0).open();
    vi.advanceTimersByTime(20_000);

    assert.equal(sources.length, 1);
  });

  test("reopens a stream refused late in its 30 seconds of silence once", ({
    sourceAt,
    sources,
  }) => {
    vi.advanceTimersByTime(29_500);
    sourceAt(0).refuse();
    vi.advanceTimersByTime(3000);

    assert.deepEqual(
      sources.map((source) => source.openedAt),
      [0, 30_500],
    );
  });

  test("leaves a dropped stream to reconnect by itself", ({sourceAt, sources}) => {
    sourceAt(0).open();
    sourceAt(0).drop();
    vi.advanceTimersByTime(1000);

    assert.equal(sources.length, 1);
  });
});

describe("the stream's silence watchdog on a channel", () => {
  test("keeps a stream that sends the channel's records within every 30 seconds", ({
    sourceAt,
    sources,
  }) => {
    sourceAt(0).open();

    vi.advanceTimersByTime(20_000);
    sourceAt(0).send({
      name: "records",
      data: [streamRecord({k: "AIRLOCK000001", v: 1, t: 1_790_560_000, s: 24})],
    });
    vi.advanceTimersByTime(20_000);

    assert.deepEqual([sourceAt(0).readyState, sources.length], [1, 1]);
  });
});

describe("the channels fed by the stream", () => {
  test("is not lost before the stream opens", ({stream}) => {
    assert.isFalse(stream.connection.get());
  });

  test("keeps the latest 150 points of a single channel's chart", ({
    stream,
    sourceAt,
  }) => {
    const store = stream.channels.AIRLOCK000001;
    const records = Array.from({length: 200}, (_, n) =>
      streamRecord({k: "AIRLOCK000001", v: 1, t: 1_790_560_000 + n, s: 24}),
    );

    sourceAt(0).send({name: "records", data: records});

    const kept = store.get();
    assert.deepEqual(
      [kept.length, kept[0]?.t, kept[149]?.t],
      [150, 1_790_560_050, 1_790_560_199],
    );
  });

  test("keeps the latest 150 points of a combined chart, as of a single channel's", ({
    stream,
    sourceAt,
  }) => {
    const store = recordsOf(
      {
        kind: "sum",
        channels: ["AIRLOCK000001", "AIRLOCK000003"],
      },
      stream.channels,
    );
    const records = Array.from({length: 200}, (_, n) =>
      streamRecord({k: "AIRLOCK000001", v: 1, t: 1_790_560_000 + n, s: 24}),
    );

    sourceAt(0).send({name: "records", data: records});

    const kept = store.get();
    assert.deepEqual(
      [kept.length, kept[0]?.t, kept[149]?.t],
      [150, 1_790_560_050, 1_790_560_199],
    );
  });

  test("keeps the sum and the average of the same channels apart", ({
    stream,
    sourceAt,
  }) => {
    const sum = recordsOf(
      {kind: "sum", channels: ["AIRLOCK000001", "AIRLOCK000003"]},
      stream.channels,
    );
    const average = recordsOf(
      {
        kind: "average",
        channels: ["AIRLOCK000001", "AIRLOCK000003"],
      },
      stream.channels,
    );

    sourceAt(0).send({
      name: "records",
      data: [streamRecord({k: "AIRLOCK000001", v: 2, t: 1_790_560_000, s: 24})],
    });
    sourceAt(0).send({
      name: "records",
      data: [streamRecord({k: "AIRLOCK000003", v: 4, t: 1_790_560_000, s: 24})],
    });

    assert.deepEqual([sum.get().at(-1)?.v, average.get().at(-1)?.v], [6, 3]);
  });

  test("gives a deviation cell its channels' largest distance from their mean", ({
    stream,
    sourceAt,
  }) => {
    const deviation = recordsOf(
      {
        kind: "deviation",
        channels: ["AIRLOCK000001", "AIRLOCK000003"],
      },
      stream.channels,
    );

    sourceAt(0).send({
      name: "records",
      data: [streamRecord({k: "AIRLOCK000001", v: 160, t: 1_790_560_000, s: 24})],
    });
    sourceAt(0).send({
      name: "records",
      data: [streamRecord({k: "AIRLOCK000003", v: 150, t: 1_790_560_000, s: 24})],
    });

    assert.equal(deviation.get().at(-1)?.v, 5);
  });

  test("gives an angle deviation cell its mirrored angles' largest distance from their mean", ({
    stream,
    sourceAt,
  }) => {
    const deviation = recordsOf(
      {
        kind: "angle-deviation",
        angles: [
          {channel: "S4000007", negated: false, turned: false},
          {channel: "S4000008", negated: true, turned: false},
        ],
      },
      stream.channels,
    );

    sourceAt(0).send({
      name: "records",
      data: [streamRecord({k: "S4000007", v: 20, t: 1_790_560_000, s: 24})],
    });
    sourceAt(0).send({
      name: "records",
      data: [streamRecord({k: "S4000008", v: 330, t: 1_790_560_000, s: 24})],
    });

    assert.closeTo(deviation.get().at(-1)?.v ?? NaN, 5, 1e-9);
  });

  test("gives a power cell the watts of its volts and amps", ({stream, sourceAt}) => {
    const power = recordsOf(
      {
        kind: "power",
        pairs: [{volts: "AIRLOCK000001", amps: "AIRLOCK000002"}],
      },
      stream.channels,
    );

    sourceAt(0).send({
      name: "records",
      data: [streamRecord({k: "AIRLOCK000001", v: 18, t: 1_790_560_000, s: 24})],
    });
    sourceAt(0).send({
      name: "records",
      data: [streamRecord({k: "AIRLOCK000002", v: 4, t: 1_790_560_000, s: 24})],
    });

    assert.equal(power.get().at(-1)?.v, 72);
  });
});
