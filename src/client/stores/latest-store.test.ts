import {assert, describe} from "vitest";
import {timedRecord} from "../test-helpers/records.ts";
import {test} from "./test-helpers/latest-store.ts";

test("takes a record after an empty reply from a channel with no records", ({
  relay,
  store,
}) => {
  relay.send([]);
  relay.send([timedRecord({t: 10, v: 1})]);

  assert.deepEqual(store.get(), [timedRecord({t: 10, v: 1})]);
});

test("takes a change that arrives within the same second as the record it holds", ({
  relay,
  store,
}) => {
  relay.send([timedRecord({t: 100, v: 1})]);
  relay.send([timedRecord({t: 100, v: 0})]);

  assert.deepEqual(store.get(), [timedRecord({t: 100, v: 0})]);
});

test("holds no record after an empty reply from a channel with no records", ({
  relay,
  store,
}) => {
  relay.send([]);

  assert.deepEqual(store.get(), []);
});

test("keeps its record when an older one arrives", ({relay, store}) => {
  relay.send([timedRecord({t: 100, v: 1})]);
  relay.send([timedRecord({t: 90, v: 2})]);

  assert.deepEqual(store.get(), [timedRecord({t: 100, v: 1})]);
});

test("takes the newest record of a batch whatever the batch's order", ({
  relay,
  store,
}) => {
  relay.send([timedRecord({t: 100, v: 1}), timedRecord({t: 90, v: 2})]);

  assert.deepEqual(store.get(), [timedRecord({t: 100, v: 1})]);
});

describe("against the clock", () => {
  test.override({now: 1_790_620_000 * 1000});

  test("ignores a record timestamped more than a minute ahead of the clock", ({
    relay,
    store,
  }) => {
    relay.send([
      timedRecord({t: 1_790_619_990, v: 1}),
      timedRecord({t: 1_790_620_061, v: 2}),
    ]);

    assert.deepEqual(store.get(), [timedRecord({t: 1_790_619_990, v: 1})]);
  });

  test("takes a record timestamped less than a minute ahead of the clock", ({
    relay,
    store,
  }) => {
    relay.send([timedRecord({t: 1_790_620_030, v: 1})]);

    assert.deepEqual(store.get(), [timedRecord({t: 1_790_620_030, v: 1})]);
  });

  test("takes a record timestamped exactly a minute ahead of the clock", ({
    relay,
    store,
  }) => {
    relay.send([timedRecord({t: 1_790_620_060, v: 1})]);

    assert.deepEqual(store.get(), [timedRecord({t: 1_790_620_060, v: 1})]);
  });
});
