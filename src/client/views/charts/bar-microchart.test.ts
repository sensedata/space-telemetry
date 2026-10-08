import {assert, describe} from "vitest";

import {startClock} from "../../signals/clock.ts";
import {signal} from "../../signals/signal.ts";
import type {TimedRecord} from "../../timed-record.ts";
import {test} from "../../test-helpers/fake-clock.ts";
import {timedRecord} from "../../test-helpers/records.ts";
import {sendEachSecond} from "../../test-helpers/send-each-second.ts";
import {barMicrochart} from "./bar-microchart.ts";

// Each bar's x, y and height.
function barsOf(container: Element) {
  return [...container.querySelectorAll(":scope svg rect")].map((bar) => [
    bar.getAttribute("x"),
    bar.getAttribute("y"),
    bar.getAttribute("height"),
  ]);
}

test("renders nothing without data", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const container = mount(
    barMicrochart({
      clock: startClock(),
      store,
      min: 0,
      max: 10,
      height: 10,
      width: 100,
    }),
  );

  assert.equal(container.innerHTML, "");
});

test("renders nothing when its channel's backfill holds no records", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const container = mount(
    barMicrochart({
      clock: startClock(),
      store,
      min: 0,
      max: 10,
      height: 10,
      width: 100,
    }),
  );

  store.set([]);

  assert.equal(container.innerHTML, "");
});

test("sets its size to that of its container", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const container = mount(
    barMicrochart({
      clock: startClock(),
      store,
      min: 0,
      max: 10,
      height: 10,
      width: 100,
    }),
  );

  store.set([timedRecord({t: 0, v: 0})]);

  const svg = container.querySelector("svg");
  assert.deepEqual(
    [svg?.getAttribute("height"), svg?.getAttribute("width")],
    ["10", "100"],
  );
});

test("names itself for a screen reader", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const container = mount(
    barMicrochart({
      clock: startClock(),
      store,
      min: 0,
      max: 10,
      height: 10,
      width: 100,
    }),
  );

  store.set([timedRecord({t: 0, v: 0})]);

  const svg = container.querySelector("svg");
  assert.deepEqual(
    [svg?.getAttribute("role"), svg?.getAttribute("aria-label")],
    ["img", "Recent values, one bar per second"],
  );
});

test("draws one bar per three pixels of width inside its inset", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const container = mount(
    barMicrochart({
      clock: startClock(),
      store,
      min: 0,
      max: 10,
      height: 10,
      width: 9 + 4,
    }),
  );

  store.set([timedRecord({t: 0, v: 0})]);

  assert.equal(container.querySelectorAll(":scope svg rect").length, 3);
});

test("fits a bar at max inside the svg", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const container = mount(
    barMicrochart({
      clock: startClock(),
      store,
      min: 0,
      max: 10,
      height: 10,
      width: 100,
    }),
  );

  store.set([timedRecord({t: 0, v: 10})]);

  const bar = container.querySelector(":scope svg rect:first-child");
  assert.deepEqual(
    [
      container.querySelector(":scope svg g")?.getAttribute("transform"),
      bar?.getAttribute("y"),
      bar?.getAttribute("height"),
    ],
    ["translate(2,2)", "0", "6"],
  );
});

test("draws a simple set of points correctly", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const clock = startClock();
  const container = mount(
    barMicrochart({clock, store, min: 0, max: 10, height: 14, width: 16}),
  );
  const start = clock.get() - 4;

  sendEachSecond(store, start, [0, 1, 5, 10]);

  assert.deepEqual(barsOf(container), [
    ["0", "10", "0"],
    ["3", "9", "1"],
    ["6", "5", "5"],
    ["9", "0", "10"],
  ]);
});

test("add a left-most point if there isn't one in the data", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const clock = startClock();
  const container = mount(
    barMicrochart({clock, store, min: 0, max: 10, height: 14, width: 16}),
  );
  const start = clock.get() - 3;

  sendEachSecond(store, start, [0, 5, 10]);

  assert.deepEqual(barsOf(container), [
    ["0", "10", "0"],
    ["3", "10", "0"],
    ["6", "5", "5"],
    ["9", "0", "10"],
  ]);
});

test("adds a right-most point if the newest data is old", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const clock = startClock();
  const container = mount(
    barMicrochart({clock, store, min: 0, max: 10, height: 14, width: 16}),
  );
  const start = clock.get() - 4;

  sendEachSecond(store, start, [0, 5, 10]);

  assert.deepEqual(barsOf(container), [
    ["0", "10", "0"],
    ["3", "5", "5"],
    ["6", "0", "10"],
    ["9", "0", "10"],
  ]);
});

test("scales bars between the min and max it is given", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const container = mount(
    barMicrochart({
      clock: startClock(),
      store,
      min: 10,
      max: 110,
      height: 14,
      width: 100,
    }),
  );

  store.set([timedRecord({t: 0, v: 60})]);

  const bar = container.querySelector(":scope svg rect:first-child");
  assert.deepEqual([bar?.getAttribute("y"), bar?.getAttribute("height")], ["5", "5"]);
});

test.for<[string, number, string[]]>([
  ["draws a value below min as a bar of no height at the foot", -5, ["10", "0"]],
  ["draws a value above max as a bar to the top", 15, ["0", "10"]],
])("%s", ([, value, expected], {mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const container = mount(
    barMicrochart({
      clock: startClock(),
      store,
      min: 0,
      max: 10,
      height: 14,
      width: 100,
    }),
  );

  store.set([timedRecord({t: 0, v: value})]);

  const bar = container.querySelector(":scope svg rect:first-child");
  assert.deepEqual([bar?.getAttribute("y"), bar?.getAttribute("height")], expected);
});

describe("at a fixed time", () => {
  test.override({now: 1_000_000 * 1000});

  test("marks the bar at a record's own second as a real point", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(
      barMicrochart({
        clock: startClock(),
        store,
        min: 0,
        max: 10,
        height: 10,
        width: 16,
      }),
    );

    store.set([timedRecord({t: 999_996, v: 5})]);

    assert.equal(
      container.querySelector(":scope svg rect:nth-child(1)")?.getAttribute("class"),
      "bar real-point",
    );
  });

  test.for([
    ["marks the bar a second after a record's own as a real point", 2, true],
    ["draws the bar two seconds after a record's own as a plain bar", 3, false],
  ] as const)("%s", ([, position, realPoint], {mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(
      barMicrochart({
        clock: startClock(),
        store,
        min: 0,
        max: 10,
        height: 10,
        width: 16,
      }),
    );

    store.set([timedRecord({t: 999_996, v: 5})]);

    const bar = container.querySelector(`:scope svg rect:nth-child(${position})`);
    assert.equal(bar?.classList.contains("real-point"), realPoint);
  });

  test("draws a bar carried forward from an older record as a plain bar", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(
      barMicrochart({
        clock: startClock(),
        store,
        min: 0,
        max: 10,
        height: 10,
        width: 16,
      }),
    );

    store.set([timedRecord({t: 999_996, v: 5})]);

    assert.equal(
      container.querySelector(":scope svg rect:nth-child(4)")?.getAttribute("class"),
      "bar",
    );
  });

  test.for<[string, number, string[]]>([
    [
      "draws every bar plain when its record is older than the window",
      999_990,
      ["bar", "bar", "bar", "bar"],
    ],
    [
      "draws plain the bars before the window's first record",
      999_998,
      ["bar", "bar", "bar real-point", "bar real-point"],
    ],
  ])("%s", ([, time, expected], {mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(
      barMicrochart({clock: startClock(), store, min: 0, max: 10, height: 10, width: 16}),
    );

    store.set([timedRecord({t: time, v: 5})]);

    assert.deepEqual(
      [...container.querySelectorAll(":scope svg rect")].map((bar) =>
        bar.getAttribute("class"),
      ),
      expected,
    );
  });

  test("marks a record's own bar real while older records stay in the store", ({
    mount,
  }) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(
      barMicrochart({clock: startClock(), store, min: 0, max: 10, height: 10, width: 16}),
    );

    store.set([timedRecord({t: 999_990, v: 5}), timedRecord({t: 999_998, v: 5})]);

    assert.deepEqual(
      [...container.querySelectorAll(":scope svg rect")].map((bar) =>
        bar.getAttribute("class"),
      ),
      ["bar", "bar", "bar real-point", "bar real-point"],
    );
  });

  test("leaves the store's records as it found them", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    mount(
      barMicrochart({clock: startClock(), store, min: 0, max: 10, height: 10, width: 16}),
    );

    store.set([timedRecord({t: 999_990, v: 5})]);

    assert.deepEqual(store.get(), [timedRecord({t: 999_990, v: 5})]);
  });
});
