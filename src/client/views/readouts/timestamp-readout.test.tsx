import {act} from "preact/test-utils";
import {assert, describe} from "vitest";

import {Relay} from "../../relay.ts";
import {SimpleStore} from "../../stores/simple-store.ts";
import {test} from "../../test-helpers/mount.ts";

import {timedRecord} from "../../test-helpers/records.ts";
import {TimestampReadout} from "./timestamp-readout.tsx";

describe("TimestampReadout", () => {
  test("renders data received before mounting", ({mount}) => {
    const relay = new Relay();
    const store = new SimpleStore(relay, {maxSize: 200});
    relay.send([timedRecord({t: 1_432_473_390})]);

    const container = mount(<TimestampReadout store={store} />);

    assert.equal(container.querySelector("span")?.textContent, "13:16:30 2015.05.24");
  });

  test("renders data received after mounting", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <TimestampReadout store={new SimpleStore(relay, {maxSize: 200})} />,
    );

    await act(() => {
      relay.send([timedRecord({t: 1_432_473_390})]);
    });

    assert.equal(container.querySelector("span")?.textContent, "13:16:30 2015.05.24");
  });

  test("renders the time of the newest record", ({mount}) => {
    const relay = new Relay();
    const store = new SimpleStore(relay, {maxSize: 200});
    relay.send([timedRecord({t: 1_790_619_990}), timedRecord({t: 1_790_620_000})]);

    const container = mount(<TimestampReadout store={store} />);

    assert.equal(container.textContent, "18:26:40 2026.09.28");
  });

  test("renders a dash when it doesn't have data", ({mount}) => {
    const container = mount(
      <TimestampReadout store={new SimpleStore(new Relay(), {maxSize: 200})} />,
    );

    assert.equal(container.querySelector("span")?.textContent, "-");
  });

  test("renders a dash when the time is 0", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <TimestampReadout store={new SimpleStore(relay, {maxSize: 200})} />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0})]);
    });

    assert.equal(container.querySelector("span")?.textContent, "-");
  });
});
