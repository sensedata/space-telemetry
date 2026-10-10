import {assert, describe} from "vitest";
import {recordsOf} from "../../src/client/cell-source.ts";
import {streamRecord} from "../../src/client/test-helpers/records.ts";
import {test} from "./test-helpers/start-stream.ts";

describe("a cell source", () => {
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
