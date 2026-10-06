import {act} from "preact/test-utils";
import {assert, describe, vi} from "vitest";

import {Clock} from "../../clock.ts";
import {Relay} from "../../relay.ts";
import {SimpleStore} from "../../stores/simple-store.ts";

import {test} from "../../test-helpers/fake-clock.ts";
import {timedRecord} from "../../test-helpers/records.ts";
import {TransmissionDelayReadout} from "./transmission-delay-readout.tsx";

describe("TransmissionDelayReadout", () => {
  test("renders the time since the transmission received after mounting", async ({
    mount,
  }) => {
    vi.setSystemTime(1_790_620_005_000);
    const relay = new Relay();
    const container = mount(
      <TransmissionDelayReadout
        clock={new Clock()}
        store={new SimpleStore(relay, {maxSize: 200})}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 1_790_620_000})]);
    });

    assert.equal(container.querySelector("span")?.textContent, "00:00:05");
  });

  test("renders total hours for an outage over a day", ({mount}) => {
    vi.setSystemTime(1_790_710_061_000);
    const relay = new Relay();
    const store = new SimpleStore(relay, {maxSize: 200});
    relay.send([timedRecord({t: 1_790_620_000})]);

    const container = mount(
      <TransmissionDelayReadout clock={new Clock()} store={store} />,
    );

    assert.equal(container.querySelector("span")?.textContent, "25:01:01");
  });

  test("advances the delay each second", async ({mount}) => {
    vi.setSystemTime(1_790_620_005_000);
    const relay = new Relay();
    const store = new SimpleStore(relay, {maxSize: 200});
    relay.send([timedRecord({t: 1_790_620_000})]);
    const container = mount(
      <TransmissionDelayReadout clock={new Clock()} store={store} />,
    );

    await act(() => {
      vi.advanceTimersByTime(1000);
    });

    assert.equal(container.querySelector("span")?.textContent, "00:00:06");
  });

  test.for([
    ["no alarm at a delay of 30 seconds", 1_790_620_030_000, ""],
    ["the alarm past a delay of 30 seconds", 1_790_620_030_001, "time-alarm"],
  ] as const)("renders %s", ([, now, className], {mount}) => {
    vi.setSystemTime(now);
    const relay = new Relay();
    const store = new SimpleStore(relay, {maxSize: 200});
    relay.send([timedRecord({t: 1_790_620_000})]);

    const container = mount(
      <TransmissionDelayReadout clock={new Clock()} store={store} />,
    );

    assert.equal(container.querySelector("span")?.className, className);
  });

  test("renders an alarmed dash when it doesn't have data", ({mount}) => {
    const container = mount(
      <TransmissionDelayReadout
        clock={new Clock()}
        store={new SimpleStore(new Relay(), {maxSize: 200})}
      />,
    );
    const span = container.querySelector("span");

    assert.deepEqual([span?.textContent, span?.className], ["-", "time-alarm"]);
  });
});
