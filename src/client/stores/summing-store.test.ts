import {assert, describe} from "vitest";
import {Relay} from "../relay.ts";
import {timedRecord} from "../test-helpers/records.ts";
import {SummingStore} from "./summing-store.ts";
import {test} from "./test-helpers/summing-store.ts";

describe("SummingStore", () => {
  test("holds no record before a channel reports", ({store}) => {
    assert.deepEqual(store.get(), []);
  });

  test("returns an total value after actions fire", ({relay1, relay2, store}) => {
    relay1.send([timedRecord({k: 1, t: 1, v: 1})]);
    relay2.send([timedRecord({k: 2, t: 1, v: 3})]);

    assert.equal(store.get()[0]?.v, 4);
  });

  test("returns all keys after actions fire", ({relay1, relay2, store}) => {
    relay1.send([timedRecord({k: 1, t: 1, v: 1})]);
    relay2.send([timedRecord({k: 2, t: 1, v: 3})]);

    assert.deepEqual(store.get()[0]?.k, [1, 2]);
  });

  test("does not duplicate keys", ({relay1, relay2, store}) => {
    relay1.send([timedRecord({k: 1, t: 1, v: 1})]);
    relay2.send([timedRecord({k: 2, t: 1, v: 3})]);
    relay1.send([timedRecord({k: 1, t: 2, v: 1})]);

    assert.deepEqual(store.get()[0]?.k, [1, 2]);
  });

  test("sums every time after a reconnect resends a channel's backfill", () => {
    const first = new Relay();
    const second = new Relay();
    const sums = new SummingStore([first, second], {maxSize: 3});
    const backfill = [
      timedRecord({k: 1, t: 1, v: 1, s: 24}),
      timedRecord({k: 1, t: 2, v: 2, s: 24}),
      timedRecord({k: 1, t: 3, v: 3, s: 24}),
    ];
    first.send(backfill);
    second.send([
      timedRecord({k: 2, t: 1, v: 10, s: 24}),
      timedRecord({k: 2, t: 2, v: 20, s: 24}),
      timedRecord({k: 2, t: 3, v: 30, s: 24}),
    ]);

    first.send(backfill);

    assert.deepEqual(
      sums.get().map((d) => d.v),
      [11, 22, 33],
    );
  });

  test("orders its times numerically", () => {
    const channel = new Relay();
    const sums = new SummingStore([channel], {maxSize: 200});

    channel.send(
      Array.from({length: 200}, (_, t) => timedRecord({k: 1, t, v: 1, s: 24})),
    );

    assert.deepEqual(
      sums.get().map((d) => d.t),
      Array.from({length: 200}, (_, t) => t),
    );
  });

  test("orders its points by time when a reconnect's backfill is older than a held record", () => {
    const channel = new Relay();
    const sums = new SummingStore([channel], {maxSize: 3});
    channel.send([timedRecord({k: 1, t: 3, v: 3, s: 24})]);

    channel.send([
      timedRecord({k: 1, t: 1, v: 1, s: 24}),
      timedRecord({k: 1, t: 2, v: 2, s: 24}),
      timedRecord({k: 1, t: 3, v: 3, s: 24}),
    ]);

    assert.deepEqual(
      sums.get().map((d) => [d.t, d.v]),
      [
        [1, 1],
        [2, 2],
        [3, 3],
      ],
    );
  });

  test("sums the channels' means", ({relay1, relay2, store}) => {
    relay1.send([timedRecord({k: 1, t: 1, v: 1, vm: 10})]);
    relay2.send([timedRecord({k: 2, t: 1, v: 3, vm: 30})]);

    assert.equal(store.get()[0]?.vm, 40);
  });

  test("updates sums correctly with new values for old keys", ({
    relay1,
    relay2,
    store,
  }) => {
    relay1.send([timedRecord({k: 1, t: 1, v: 1})]);
    relay2.send([timedRecord({k: 2, t: 1, v: 3})]);
    relay1.send([timedRecord({k: 1, t: 2, v: 2})]);

    assert.deepEqual(
      store.get().map((d) => d.v),
      [4, 5],
    );
  });

  test("updates sums correctly with missing values at start time", ({
    relay1,
    relay2,
    store,
  }) => {
    relay1.send([timedRecord({k: 1, t: 1, v: 1})]);
    relay2.send([timedRecord({k: 2, t: 2, v: 3})]);
    relay1.send([timedRecord({k: 1, t: 2, v: 2})]);

    assert.deepEqual(
      store.get().map((d) => d.v),
      [1, 5],
    );
  });

  test("leaves a record without a value out of the sum", ({relay1, relay2, store}) => {
    relay1.send([timedRecord({k: 1, t: 1, v: 1})]);
    relay1.send([timedRecord({k: 1, t: 2, v: undefined})]);
    relay2.send([timedRecord({k: 2, t: 2, v: 3})]);

    assert.deepEqual(
      store.get().map((d) => d.v),
      [1, 4],
    );
  });

  test("holds no record after its channels' empty backfills", ({
    relay1,
    relay2,
    store,
  }) => {
    relay1.send([]);
    relay2.send([]);

    assert.deepEqual(store.get(), []);
  });

  test("defaults max size to one when omitted", () => {
    const relay1 = new Relay();
    const relay2 = new Relay();
    const store = new SummingStore([relay1, relay2], {});

    relay1.send([timedRecord({k: 1, t: 1, v: 1})]);
    relay1.send([timedRecord({k: 1, t: 2, v: 2})]);

    relay2.send([timedRecord({k: 2, t: 1, v: 5})]);
    relay2.send([timedRecord({k: 2, t: 2, v: 6})]);

    assert.deepEqual(
      store.get().map((d) => d.v),
      [8],
    );
  });

  test("defaults max size to one when props are omitted", () => {
    const relay1 = new Relay();
    const relay2 = new Relay();
    const store = new SummingStore([relay1, relay2]);

    relay1.send([timedRecord({k: 1, t: 1, v: 1})]);
    relay1.send([timedRecord({k: 1, t: 2, v: 2})]);

    relay2.send([timedRecord({k: 2, t: 1, v: 5})]);
    relay2.send([timedRecord({k: 2, t: 2, v: 6})]);

    assert.deepEqual(
      store.get().map((d) => d.v),
      [8],
    );
  });

  test("prunes data in time order when overloaded", () => {
    const relay1 = new Relay();
    const relay2 = new Relay();
    const store = new SummingStore([relay1, relay2], {maxSize: 3});

    relay1.send([timedRecord({k: 1, t: 1, v: 1})]);
    relay1.send([timedRecord({k: 1, t: 2, v: 2})]);
    relay1.send([timedRecord({k: 1, t: 3, v: 3})]);
    relay1.send([timedRecord({k: 1, t: 4, v: 4})]);

    relay2.send([timedRecord({k: 2, t: 1, v: 5})]);
    relay2.send([timedRecord({k: 2, t: 2, v: 6})]);
    relay2.send([timedRecord({k: 2, t: 3, v: 7})]);
    relay2.send([timedRecord({k: 2, t: 4, v: 8})]);

    assert.deepEqual(
      store.get().map((d) => d.v),
      [8, 10, 12],
    );
  });

  test("prunes excess internal data points", () => {
    const relay1 = new Relay();
    const relay2 = new Relay();
    const store = new SummingStore([relay1, relay2], {maxSize: 3});

    relay1.send([timedRecord({k: 1, t: 1, v: 1})]);
    relay1.send([timedRecord({k: 1, t: 2, v: 2})]);
    relay1.send([timedRecord({k: 1, t: 3, v: 3})]);
    relay1.send([timedRecord({k: 1, t: 4, v: 4})]);

    relay2.send([timedRecord({k: 2, t: 1, v: 5})]);
    relay2.send([timedRecord({k: 2, t: 2, v: 6})]);
    relay2.send([timedRecord({k: 2, t: 3, v: 7})]);
    relay2.send([timedRecord({k: 2, t: 4, v: 8})]);

    assert.equal(store.telemetry.get(1)?.length, 3);
    assert.equal(store.telemetry.get(2)?.length, 3);
  });
});
