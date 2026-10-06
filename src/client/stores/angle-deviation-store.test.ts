import {assert, test} from "vitest";
import {Relay} from "../relay.ts";
import {timedRecord} from "../test-helpers/records.ts";
import {AngleDeviationStore} from "./angle-deviation-store.ts";

const plain = {negated: false, turned: false};

test("gives the largest distance of any angle from the mean of them all", () => {
  const first = new Relay();
  const second = new Relay();
  const store = new AngleDeviationStore(
    [
      {...plain, channel: {number: 1, relay: first}},
      {...plain, channel: {number: 2, relay: second}},
    ],
    {maxSize: 100},
  );

  first.send([timedRecord({k: 1, t: 1, v: 10})]);
  second.send([timedRecord({k: 2, t: 1, v: 30})]);

  assert.closeTo(store.get().at(-1)?.v ?? NaN, 10, 1e-9);
});

test("measures across the turn from 360 back to 0", () => {
  const first = new Relay();
  const second = new Relay();
  const store = new AngleDeviationStore(
    [
      {...plain, channel: {number: 1, relay: first}},
      {...plain, channel: {number: 2, relay: second}},
    ],
    {maxSize: 100},
  );

  first.send([timedRecord({k: 1, t: 1, v: 359})]);
  second.send([timedRecord({k: 2, t: 1, v: 1})]);

  assert.closeTo(store.get().at(-1)?.v ?? NaN, 1, 1e-9);
});

test("finds no deviation among mirrored mountings turned alike", () => {
  const relays = [new Relay(), new Relay(), new Relay(), new Relay()] as const;
  const store = new AngleDeviationStore(
    [
      {negated: false, turned: false, channel: {number: 1, relay: relays[0]}},
      {negated: true, turned: false, channel: {number: 2, relay: relays[1]}},
      {negated: true, turned: true, channel: {number: 3, relay: relays[2]}},
      {negated: false, turned: true, channel: {number: 4, relay: relays[3]}},
    ],
    {maxSize: 100},
  );

  relays[0].send([timedRecord({k: 1, t: 1, v: 20})]);
  relays[1].send([timedRecord({k: 2, t: 1, v: 340})]);
  relays[2].send([timedRecord({k: 3, t: 1, v: 160})]);
  relays[3].send([timedRecord({k: 4, t: 1, v: 200})]);

  assert.closeTo(store.get().at(-1)?.v ?? NaN, 0, 1e-9);
});

test("finds the one mirrored mounting turned apart from the rest", () => {
  const relays = [new Relay(), new Relay(), new Relay(), new Relay()] as const;
  const store = new AngleDeviationStore(
    [
      {negated: false, turned: false, channel: {number: 1, relay: relays[0]}},
      {negated: true, turned: false, channel: {number: 2, relay: relays[1]}},
      {negated: true, turned: true, channel: {number: 3, relay: relays[2]}},
      {negated: false, turned: true, channel: {number: 4, relay: relays[3]}},
    ],
    {maxSize: 100},
  );

  relays[0].send([timedRecord({k: 1, t: 1, v: 20})]);
  relays[1].send([timedRecord({k: 2, t: 1, v: 340})]);
  relays[2].send([timedRecord({k: 3, t: 1, v: 160})]);
  relays[3].send([timedRecord({k: 4, t: 1, v: 240})]);

  assert.closeTo(store.get().at(-1)?.v ?? NaN, 30.31, 0.01);
});

test("marks the mean of the deviations it holds", () => {
  const first = new Relay();
  const second = new Relay();
  const store = new AngleDeviationStore(
    [
      {...plain, channel: {number: 1, relay: first}},
      {...plain, channel: {number: 2, relay: second}},
    ],
    {maxSize: 100},
  );

  first.send([timedRecord({k: 1, t: 1, v: 10})]);
  second.send([timedRecord({k: 2, t: 1, v: 10}), timedRecord({k: 2, t: 2, v: 12})]);

  assert.closeTo(store.get().at(-1)?.vm ?? NaN, 0.5, 1e-9);
});
