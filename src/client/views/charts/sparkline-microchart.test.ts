import {assert, describe, vi} from "vitest";

import {startClock} from "../../signals/clock.ts";
import {signal} from "../../signals/signal.ts";
import type {TimedRecord} from "../../timed-record.ts";
import {test} from "../../test-helpers/fake-clock.ts";
import {timedRecord} from "../../test-helpers/records.ts";
import {sendEachSecond} from "../../test-helpers/send-each-second.ts";
import {sparklineMicrochart} from "./sparkline-microchart.ts";

test("renders nothing without data", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const container = mount(
    sparklineMicrochart({
      clock: startClock(),
      store,
      height: 100,
      width: 100,
    }),
  );

  assert.equal(container.innerHTML, "");
});

test("renders nothing when its channel's backfill holds no records", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const container = mount(
    sparklineMicrochart({
      clock: startClock(),
      store,
      height: 100,
      width: 100,
    }),
  );

  store.set([]);

  assert.equal(container.innerHTML, "");
});

test("renders nothing when none of its records has a value", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const container = mount(
    sparklineMicrochart({
      clock: startClock(),
      store,
      height: 100,
      width: 100,
    }),
  );

  store.set([timedRecord({t: 0, v: undefined}), timedRecord({t: 1, v: undefined})]);

  assert.equal(container.innerHTML, "");
});

test("sets its size to that of its container", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const container = mount(
    sparklineMicrochart({
      clock: startClock(),
      store,
      height: 100,
      width: 100,
    }),
  );

  store.set([timedRecord({t: 0, v: 1})]);

  const svg = container.querySelector("svg");
  assert.deepEqual(
    [svg?.getAttribute("height"), svg?.getAttribute("width")],
    ["100", "100"],
  );
});

test("names itself for a screen reader and for the stylesheet", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const container = mount(
    sparklineMicrochart({
      clock: startClock(),
      store,
      height: 100,
      width: 100,
    }),
  );

  store.set([timedRecord({t: 0, v: 1})]);

  const svg = container.querySelector("svg");
  assert.deepEqual(
    [
      svg?.getAttribute("role"),
      svg?.getAttribute("aria-label"),
      svg?.getAttribute("class"),
      container.querySelector(":scope svg rect")?.getAttribute("class"),
    ],
    ["img", "Recent values over time, newest circled", "sparkline", "qualitative"],
  );
});

test("draws a simple set of points correctly", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const clock = startClock();
  const container = mount(
    sparklineMicrochart({
      clock,
      store,
      height: 10 + 4,
      width: 4 + 6,
    }),
  );
  const start = clock.get() - 4;

  sendEachSecond(store, start, [0, 1, 5, 10]);

  // The path is the basis spline through (-2,0), (0,1), (2,5), and (4,10). Its control
  // points are the thirds and sixths between them, which d3-shape rounds to 3 decimals, and
  // 0.0005 px is invisible. The oldest record is a second before the left edge, so it lies
  // left of x = 0.
  assert.equal(
    container.querySelector(":scope svg path")?.getAttribute("d"),
    "M-2,0L-1.667,0.167C-1.333,0.333,-0.667,0.667,0,1.5C0.667,2.333,1.333,3.667,2,5.167C2.667,6.667,3.333,8.333,3.667,9.167L4,10",
  );
});

test("renders a correct qualitative range", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const clock = startClock();
  const container = mount(
    sparklineMicrochart({
      clock,
      store,
      height: 10 + 4,
      width: 4 + 6,
    }),
  );
  const start = clock.get() - 4;

  sendEachSecond(store, start, [0, 1, 5, 10]);

  // The range covers the middle four tenths of a height of 14, where 0.4 × 14 carries a
  // floating-point error. Its width falls 1.5 short of 10.
  const rect = container.querySelector(":scope svg rect");
  assert.deepEqual(
    [rect?.getAttribute("y"), rect?.getAttribute("height"), rect?.getAttribute("width")],
    ["4.2", "5.6000000000000005", "8.5"],
  );
});

describe("at a fixed time", () => {
  test.override({now: 1_000_000 * 1000});

  test("places the current-value dot at the present when the newest record is old", ({
    mount,
  }) => {
    const staleStore = signal<readonly TimedRecord[]>([]);
    const freshStore = signal<readonly TimedRecord[]>([]);
    const stale = mount(
      sparklineMicrochart({
        clock: startClock(),
        store: staleStore,
        height: 14,
        width: 36,
      }),
    );
    const fresh = mount(
      sparklineMicrochart({
        clock: startClock(),
        store: freshStore,
        height: 14,
        width: 36,
      }),
    );

    staleStore.set([timedRecord({t: 999_990, v: 3})]);
    freshStore.set([timedRecord({t: 1_000_000, v: 3})]);

    assert.equal(
      stale.querySelector("circle")?.getAttribute("cx"),
      fresh.querySelector("circle")?.getAttribute("cx"),
    );
  });

  test("starts the line at the left edge when its oldest record is older than the chart", ({
    mount,
  }) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(
      sparklineMicrochart({
        clock: startClock(),
        store,
        height: 14,
        width: 36,
      }),
    );

    store.set([timedRecord({t: 999_980, v: 1}), timedRecord({t: 999_998, v: 5})]);

    assert.match(
      container.querySelector(":scope svg path")?.getAttribute("d") ?? "",
      /^M0,/,
    );
  });

  test("leaves the current-value dot at a record exactly two seconds old", ({mount}) => {
    const recentStore = signal<readonly TimedRecord[]>([]);
    const freshStore = signal<readonly TimedRecord[]>([]);
    const recent = mount(
      sparklineMicrochart({
        clock: startClock(),
        store: recentStore,
        height: 14,
        width: 36,
      }),
    );
    const fresh = mount(
      sparklineMicrochart({
        clock: startClock(),
        store: freshStore,
        height: 14,
        width: 36,
      }),
    );

    recentStore.set([timedRecord({t: 999_998, v: 3})]);
    freshStore.set([timedRecord({t: 1_000_000, v: 3})]);

    assert.notEqual(
      recent.querySelector("circle")?.getAttribute("cx"),
      fresh.querySelector("circle")?.getAttribute("cx"),
    );
  });

  // In this test and the next, a width of 12 holds four seconds, the last a second before
  // now, over 6 pixels. The dot of a record at now is at 8 and moves 2 pixels left each
  // second.
  test("redraws each second", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(
      sparklineMicrochart({
        clock: startClock(),
        store,
        height: 14,
        width: 12,
      }),
    );
    store.set([timedRecord({t: 1_000_000, v: 3})]);

    vi.advanceTimersByTime(1000);

    assert.equal(container.querySelector("circle")?.getAttribute("cx"), "6");
  });

  test("moves a silent channel's dot left until its next record", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(
      sparklineMicrochart({
        clock: startClock(),
        store,
        height: 14,
        width: 12,
      }),
    );
    store.set([timedRecord({t: 1_000_000, v: 3})]);

    vi.advanceTimersByTime(3000);

    assert.equal(container.querySelector("circle")?.getAttribute("cx"), "2");
  });
});
