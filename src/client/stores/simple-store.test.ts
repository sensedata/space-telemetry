import {assert, describe} from "vitest";
import {timedRecord} from "../test-helpers/records.ts";
import {SimpleStore} from "./simple-store.ts";
import {test} from "./test-helpers/simple-store.ts";

describe("SimpleStore", () => {
  test("returns an empty array without data", ({store}) => {
    assert.deepEqual(store.get(), []);
  });

  test("returns data in ascending order by time", ({relay, store}) => {
    relay.send([timedRecord({t: 1}), timedRecord({t: 0}), timedRecord({t: 2})]);

    assert.deepEqual(
      store.get().map((d) => d.t),
      [0, 1, 2],
    );
  });

  test("drops a record it holds already, as a reconnect's backfill resends it", ({
    relay,
    store,
  }) => {
    relay.send([timedRecord({t: 1, v: 5, s: 24}), timedRecord({t: 2, v: 6, s: 24})]);
    relay.send([timedRecord({t: 2, v: 6, s: 24})]);

    assert.deepEqual(store.get(), [
      timedRecord({t: 1, v: 5, s: 24}),
      timedRecord({t: 2, v: 6, s: 24}),
    ]);
  });

  test("keeps a record that differs from a held one only in status", ({relay, store}) => {
    relay.send([timedRecord({t: 1, v: 5, s: 24})]);
    relay.send([timedRecord({t: 1, v: 5, s: 0})]);

    assert.deepEqual(store.get(), [
      timedRecord({t: 1, v: 5, s: 24}),
      timedRecord({t: 1, v: 5, s: 0}),
    ]);
  });

  test("prunes data in time order when overloaded", ({relay}) => {
    const store = new SimpleStore(relay, {maxSize: 3});
    relay.send([
      timedRecord({t: 1}),
      timedRecord({t: 0}),
      timedRecord({t: 2}),
      timedRecord({t: 3}),
    ]);

    assert.deepEqual(
      store.get().map((d) => d.t),
      [1, 2, 3],
    );
  });

  test("defaults max size to one when omitted", ({relay}) => {
    const store = new SimpleStore(relay, {});
    relay.send([
      timedRecord({t: 1}),
      timedRecord({t: 0}),
      timedRecord({t: 2}),
      timedRecord({t: 3}),
    ]);

    assert.deepEqual(
      store.get().map((d) => d.t),
      [3],
    );
  });

  test("holds one record when max size is zero", ({relay}) => {
    const store = new SimpleStore(relay, {maxSize: 0});
    relay.send([
      timedRecord({t: 1}),
      timedRecord({t: 0}),
      timedRecord({t: 2}),
      timedRecord({t: 3}),
    ]);

    assert.deepEqual(
      store.get().map((d) => d.t),
      [3],
    );
  });

  test("defaults max size to one when props are omitted", ({relay}) => {
    const store = new SimpleStore(relay);
    relay.send([
      timedRecord({t: 1}),
      timedRecord({t: 0}),
      timedRecord({t: 2}),
      timedRecord({t: 3}),
    ]);

    assert.deepEqual(
      store.get().map((d) => d.t),
      [3],
    );
  });
});
