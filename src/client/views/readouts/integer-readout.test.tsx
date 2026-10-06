import {act} from "preact/test-utils";
import {assert, describe} from "vitest";

import {Relay} from "../../relay.ts";
import {SimpleStore} from "../../stores/simple-store.ts";
import {test} from "../../test-helpers/mount.ts";

import {timedRecord} from "../../test-helpers/records.ts";
import {IntegerReadout} from "./integer-readout.tsx";

describe("IntegerReadout", () => {
  test("renders data received before mounting", ({mount}) => {
    const relay = new Relay();
    const store = new SimpleStore(relay, {maxSize: 200});
    relay.send([timedRecord({t: 0, v: 97_816_348_761_234})]);

    const container = mount(<IntegerReadout store={store} />);

    assert.equal(container.querySelector("span")?.textContent, "97816348761234");
  });

  test("renders data received after mounting", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <IntegerReadout store={new SimpleStore(relay, {maxSize: 200})} />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 97_816_348_761_234})]);
    });

    assert.equal(container.querySelector("span")?.textContent, "97816348761234");
  });

  test("renders the newest record's value", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <IntegerReadout store={new SimpleStore(relay, {maxSize: 200})} />,
    );

    await act(() => {
      relay.send([timedRecord({t: 1, v: 3}), timedRecord({t: 2, v: 7})]);
    });

    assert.equal(container.textContent, "7");
  });

  test("renders the later of two records within the same second", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <IntegerReadout store={new SimpleStore(relay, {maxSize: 200})} />,
    );

    await act(() => {
      relay.send([timedRecord({t: 10, v: 3}), timedRecord({t: 10, v: 7})]);
    });

    assert.equal(container.textContent, "7");
  });

  test("rounds decimals", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <IntegerReadout store={new SimpleStore(relay, {maxSize: 200})} />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 10.6})]);
    });

    assert.equal(container.querySelector("span")?.textContent, "11");
  });

  test("renders a dash for a record without a value", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <IntegerReadout store={new SimpleStore(relay, {maxSize: 200})} />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: undefined})]);
    });

    assert.equal(container.querySelector("span")?.textContent, "-");
  });

  test("renders a dash when it doesn't have data", ({mount}) => {
    const container = mount(
      <IntegerReadout store={new SimpleStore(new Relay(), {maxSize: 200})} />,
    );

    assert.equal(container.querySelector("span")?.textContent, "-");
  });
});
