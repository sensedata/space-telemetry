import {assert, describe, vi} from "vitest";

import {startClock} from "../../signals/clock.ts";
import {signal} from "../../signals/signal.ts";
import type {TimedRecord} from "../../timed-record.ts";

import {test} from "../../test-helpers/fake-clock.ts";
import {timedRecord} from "../../test-helpers/records.ts";
import {transmissionDelayReadout} from "./transmission-delay-readout.ts";

describe("transmissionDelayReadout", () => {
  test("renders the time since the transmission received after mounting", ({mount}) => {
    vi.setSystemTime(1_790_620_005_000);
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(
      transmissionDelayReadout({
        clock: startClock(),
        store,
      }),
    );

    store.set([timedRecord({t: 1_790_620_000})]);

    assert.equal(container.querySelector("span")?.textContent, "00:00:05");
  });

  test("renders the time since the newest record", ({mount}) => {
    vi.setSystemTime(1_790_620_005_000);
    const store = signal([
      timedRecord({t: 1_790_619_000}),
      timedRecord({t: 1_790_620_000}),
    ]);

    const container = mount(transmissionDelayReadout({clock: startClock(), store}));

    assert.equal(container.querySelector("span")?.textContent, "00:00:05");
  });

  test("renders a transmission after now as a negative delay", ({mount}) => {
    vi.setSystemTime(1_790_619_995_000);
    const store = signal([timedRecord({t: 1_790_620_000})]);

    const container = mount(transmissionDelayReadout({clock: startClock(), store}));

    assert.equal(container.querySelector("span")?.textContent, "-00:00:05");
  });

  test("renders total hours for an outage over a day", ({mount}) => {
    vi.setSystemTime(1_790_710_061_000);
    const store = signal([timedRecord({t: 1_790_620_000})]);

    const container = mount(transmissionDelayReadout({clock: startClock(), store}));

    assert.equal(container.querySelector("span")?.textContent, "25:01:01");
  });

  test("advances the delay each second", ({mount}) => {
    vi.setSystemTime(1_790_620_005_000);
    const store = signal([timedRecord({t: 1_790_620_000})]);
    const container = mount(transmissionDelayReadout({clock: startClock(), store}));

    vi.advanceTimersByTime(1000);

    assert.equal(container.querySelector("span")?.textContent, "00:00:06");
  });

  test.for([
    ["no alarm at a delay of 30 seconds", 1_790_620_030_000, ""],
    ["the alarm past a delay of 30 seconds", 1_790_620_031_000, "time-alarm"],
    ["the alarm past a transmission 30 seconds ahead", 1_790_619_969_000, "time-alarm"],
  ] as const)("renders %s", ([, now, className], {mount}) => {
    vi.setSystemTime(now);
    const store = signal([timedRecord({t: 1_790_620_000})]);

    const container = mount(transmissionDelayReadout({clock: startClock(), store}));

    assert.equal(container.querySelector("span")?.className, className);
  });

  test("renders an alarmed dash when it doesn't have data", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(
      transmissionDelayReadout({
        clock: startClock(),
        store,
      }),
    );
    const span = container.querySelector("span");

    assert.deepEqual([span?.textContent, span?.className], ["-", "time-alarm"]);
  });
});
