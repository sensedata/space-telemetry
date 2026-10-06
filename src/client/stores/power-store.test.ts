import {assert, test} from "vitest";
import {Relay} from "../relay.ts";
import {timedRecord} from "../test-helpers/records.ts";
import {PowerStore} from "./power-store.ts";

test("multiplies a supply's volts by its amps", () => {
  const volts = new Relay();
  const amps = new Relay();
  const store = new PowerStore(
    [{volts: {number: 1, relay: volts}, amps: {number: 2, relay: amps}}],
    {maxSize: 100},
  );

  volts.send([timedRecord({k: 1, t: 1, v: 18})]);
  amps.send([timedRecord({k: 2, t: 1, v: 4})]);

  assert.equal(store.get().at(-1)?.v, 72);
});

test("adds the watts of each supply", () => {
  const suitVolts = new Relay();
  const suitAmps = new Relay();
  const utilityVolts = new Relay();
  const utilityAmps = new Relay();
  const store = new PowerStore(
    [
      {volts: {number: 1, relay: suitVolts}, amps: {number: 2, relay: suitAmps}},
      {volts: {number: 5, relay: utilityVolts}, amps: {number: 6, relay: utilityAmps}},
    ],
    {maxSize: 100},
  );

  suitVolts.send([timedRecord({k: 1, t: 1, v: 18})]);
  suitAmps.send([timedRecord({k: 2, t: 1, v: 4})]);
  utilityVolts.send([timedRecord({k: 5, t: 1, v: 28})]);
  utilityAmps.send([timedRecord({k: 6, t: 1, v: 2})]);

  assert.equal(store.get().at(-1)?.v, 128);
});

test("counts no watts for a supply whose amps have not reported", () => {
  const suitVolts = new Relay();
  const suitAmps = new Relay();
  const utilityVolts = new Relay();
  const store = new PowerStore(
    [
      {volts: {number: 1, relay: suitVolts}, amps: {number: 2, relay: suitAmps}},
      {volts: {number: 5, relay: utilityVolts}, amps: {number: 6, relay: new Relay()}},
    ],
    {maxSize: 100},
  );

  suitVolts.send([timedRecord({k: 1, t: 1, v: 18})]);
  suitAmps.send([timedRecord({k: 2, t: 1, v: 4})]);
  utilityVolts.send([timedRecord({k: 5, t: 1, v: 28})]);

  assert.equal(store.get().at(-1)?.v, 72);
});

test("follows each channel's newest value through time", () => {
  const volts = new Relay();
  const amps = new Relay();
  const store = new PowerStore(
    [{volts: {number: 1, relay: volts}, amps: {number: 2, relay: amps}}],
    {maxSize: 100},
  );

  volts.send([timedRecord({k: 1, t: 1, v: 18})]);
  amps.send([timedRecord({k: 2, t: 1, v: 4}), timedRecord({k: 2, t: 2, v: 5})]);

  assert.deepEqual(
    store.get().map((record) => record.v),
    [72, 90],
  );
});

test("marks the mean of the watts it holds, not the product of the channels' means", () => {
  const volts = new Relay();
  const amps = new Relay();
  const store = new PowerStore(
    [{volts: {number: 1, relay: volts}, amps: {number: 2, relay: amps}}],
    {maxSize: 100},
  );

  volts.send([timedRecord({k: 1, t: 1, v: 18, vm: 9})]);
  amps.send([
    timedRecord({k: 2, t: 1, v: 4, vm: 2}),
    timedRecord({k: 2, t: 2, v: 5, vm: 2}),
  ]);

  assert.equal(store.get().at(-1)?.vm, 81);
});

test("holds no watts while no supply has both its volts and its amps", () => {
  const volts = new Relay();
  const store = new PowerStore(
    [{volts: {number: 1, relay: volts}, amps: {number: 2, relay: new Relay()}}],
    {maxSize: 100},
  );

  volts.send([timedRecord({k: 1, t: 1, v: 18})]);

  assert.deepEqual(store.get(), []);
});
