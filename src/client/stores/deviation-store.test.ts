import {assert, test} from "vitest";
import {Relay} from "../relay.ts";
import {timedRecord} from "../test-helpers/records.ts";
import {DeviationStore} from "./deviation-store.ts";

test("gives the largest distance of any channel's value from the mean of them all", () => {
  const relays = [new Relay(), new Relay(), new Relay(), new Relay()] as const;
  const store = new DeviationStore(relays, {maxSize: 100});

  relays[0].send([timedRecord({k: 1, t: 1, v: 160})]);
  relays[1].send([timedRecord({k: 2, t: 1, v: 160})]);
  relays[2].send([timedRecord({k: 3, t: 1, v: 160})]);
  relays[3].send([timedRecord({k: 4, t: 1, v: 152})]);

  assert.equal(store.get().at(-1)?.v, 6);
});

test("gives a pair of channels half their difference", () => {
  const first = new Relay();
  const second = new Relay();
  const store = new DeviationStore([first, second], {maxSize: 100});

  first.send([timedRecord({k: 1, t: 1, v: 160})]);
  second.send([timedRecord({k: 2, t: 1, v: 150})]);

  assert.equal(store.get().at(-1)?.v, 5);
});

test("gives a lone reporting channel no deviation", () => {
  const first = new Relay();
  const store = new DeviationStore([first, new Relay()], {maxSize: 100});

  first.send([timedRecord({k: 1, t: 1, v: 160})]);

  assert.equal(store.get().at(-1)?.v, 0);
});

test("marks the deviation of the channels' means", () => {
  const first = new Relay();
  const second = new Relay();
  const store = new DeviationStore([first, second], {maxSize: 100});

  first.send([timedRecord({k: 1, t: 1, v: 160, vm: 158})]);
  second.send([timedRecord({k: 2, t: 1, v: 150, vm: 154})]);

  assert.equal(store.get().at(-1)?.vm, 2);
});
