import {assert, describe} from "vitest";

import {signal} from "../../signals/signal.ts";
import type {TimedRecord} from "../../timed-record.ts";
import {test} from "../../test-helpers/mount.ts";

import {timedRecord} from "../../test-helpers/records.ts";
import {integerReadout} from "./integer-readout.ts";

describe("integerReadout", () => {
  test("renders data received before mounting", ({mount}) => {
    const store = signal([timedRecord({t: 0, v: 97_816_348_761_234})]);

    const container = mount(integerReadout(store));

    assert.equal(container.querySelector("span")?.textContent, "97816348761234");
  });

  test("renders data received after mounting", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(integerReadout(store));

    store.set([timedRecord({t: 0, v: 97_816_348_761_234})]);

    assert.equal(container.querySelector("span")?.textContent, "97816348761234");
  });

  test("renders the newest record's value", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(integerReadout(store));

    store.set([timedRecord({t: 1, v: 3}), timedRecord({t: 2, v: 7})]);

    assert.equal(container.textContent, "7");
  });

  test("renders the later of two records within the same second", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(integerReadout(store));

    store.set([timedRecord({t: 10, v: 3}), timedRecord({t: 10, v: 7})]);

    assert.equal(container.textContent, "7");
  });

  test("rounds decimals", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(integerReadout(store));

    store.set([timedRecord({t: 0, v: 10.6})]);

    assert.equal(container.querySelector("span")?.textContent, "11");
  });

  test("renders a dash for a record without a value", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(integerReadout(store));

    store.set([timedRecord({t: 0, v: undefined})]);

    assert.equal(container.querySelector("span")?.textContent, "-");
  });

  test("renders a dash when it doesn't have data", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(integerReadout(store));

    assert.equal(container.querySelector("span")?.textContent, "-");
  });
});
