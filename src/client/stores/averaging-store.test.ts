import {assert, describe} from "vitest";
import {Relay} from "../relay.ts";
import {timedRecord} from "../test-helpers/records.ts";
import {AveragingStore} from "./averaging-store.ts";
import {test} from "./test-helpers/averaging-store.ts";

describe("AveragingStore", () => {
  test("holds no record before a channel reports", ({store}) => {
    assert.deepEqual(store.get(), []);
  });

  test("returns an average value after actions fire", ({relay1, relay2, store}) => {
    relay1.send([timedRecord({k: 1, t: 1, v: 1})]);
    relay2.send([timedRecord({k: 2, t: 1, v: 3})]);

    assert.equal(store.get()[0]?.v, 2);
  });

  test("averages the channels' means", ({relay1, relay2, store}) => {
    relay1.send([timedRecord({k: 1, t: 1, v: 1, vm: 10})]);
    relay2.send([timedRecord({k: 2, t: 1, v: 3, vm: 30})]);

    assert.equal(store.get()[0]?.vm, 20);
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

  test("updates averages correctly with new values for old keys", ({
    relay1,
    relay2,
    store,
  }) => {
    relay1.send([timedRecord({k: 1, t: 1, v: 1})]);
    relay2.send([timedRecord({k: 2, t: 1, v: 3})]);
    relay1.send([timedRecord({k: 1, t: 2, v: 2})]);

    assert.deepEqual(
      store.get().map((d) => d.v),
      [2, 2.5],
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
      [1, 2.5],
    );
  });

  test("leaves a record without a value out of the average", ({
    relay1,
    relay2,
    store,
  }) => {
    relay1.send([timedRecord({k: 1, t: 1, v: 1})]);
    relay1.send([timedRecord({k: 1, t: 2, v: undefined})]);
    relay2.send([timedRecord({k: 2, t: 2, v: 3})]);

    assert.deepEqual(
      store.get().map((d) => d.v),
      [1, 2],
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
    const store = new AveragingStore([relay1, relay2], {});

    relay1.send([timedRecord({k: 1, t: 1, v: 1})]);
    relay1.send([timedRecord({k: 1, t: 2, v: 2})]);

    relay2.send([timedRecord({k: 2, t: 1, v: 5})]);
    relay2.send([timedRecord({k: 2, t: 2, v: 6})]);

    assert.deepEqual(
      store.get().map((d) => d.v),
      [4],
    );
  });

  test("defaults max size to one when props are omitted", () => {
    const relay1 = new Relay();
    const relay2 = new Relay();
    const store = new AveragingStore([relay1, relay2]);

    relay1.send([timedRecord({k: 1, t: 1, v: 1})]);
    relay1.send([timedRecord({k: 1, t: 2, v: 2})]);

    relay2.send([timedRecord({k: 2, t: 1, v: 5})]);
    relay2.send([timedRecord({k: 2, t: 2, v: 6})]);

    assert.deepEqual(
      store.get().map((d) => d.v),
      [4],
    );
  });

  test("prunes data in time order when overloaded", () => {
    const relay1 = new Relay();
    const relay2 = new Relay();
    const store = new AveragingStore([relay1, relay2], {maxSize: 3});

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
      [4, 5, 6],
    );
  });

  test("prunes excess internal data points", () => {
    const relay1 = new Relay();
    const relay2 = new Relay();
    const store = new AveragingStore([relay1, relay2], {maxSize: 3});

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
