import {act} from "preact/test-utils";
import {assert, describe, vi} from "vitest";

import {Clock} from "../../clock.ts";
import {Relay} from "../../relay.ts";
import {SimpleStore} from "../../stores/simple-store.ts";
import {test} from "../../test-helpers/fake-clock.ts";
import {timedRecord} from "../../test-helpers/records.ts";
import {sendEachSecond} from "../../test-helpers/send-each-second.ts";
import {unixNow} from "../unix-now.ts";
import {SparklineMicrochart} from "./sparkline-microchart.tsx";

test("renders nothing without data", ({mount}) => {
  const container = mount(
    <SparklineMicrochart
      clock={new Clock()}
      store={new SimpleStore(new Relay(), {maxSize: 200})}
      height={100}
      width={100}
    />,
  );

  assert.equal(container.innerHTML, "");
});

test("renders nothing when its channel's backfill holds no records", async ({mount}) => {
  const relay = new Relay();
  const container = mount(
    <SparklineMicrochart
      clock={new Clock()}
      store={new SimpleStore(relay, {maxSize: 200})}
      height={100}
      width={100}
    />,
  );

  await act(() => {
    relay.send([]);
  });

  assert.equal(container.innerHTML, "");
});

test("renders nothing when none of its records has a value", async ({mount}) => {
  const relay = new Relay();
  const container = mount(
    <SparklineMicrochart
      clock={new Clock()}
      store={new SimpleStore(relay, {maxSize: 200})}
      height={100}
      width={100}
    />,
  );

  await act(() => {
    relay.send([timedRecord({t: 0, v: undefined}), timedRecord({t: 1, v: undefined})]);
  });

  assert.equal(container.innerHTML, "");
});

test("sets its size to that of its container", async ({mount}) => {
  const relay = new Relay();
  const container = mount(
    <SparklineMicrochart
      clock={new Clock()}
      store={new SimpleStore(relay, {maxSize: 200})}
      height={100}
      width={100}
    />,
  );

  await act(() => {
    relay.send([timedRecord({t: 0, v: 1})]);
  });

  const svg = container.querySelector("svg");
  assert.deepEqual(
    [svg?.getAttribute("height"), svg?.getAttribute("width")],
    ["100", "100"],
  );
});

test("draws a simple set of points correctly", async ({mount}) => {
  const relay = new Relay();
  const container = mount(
    <SparklineMicrochart
      clock={new Clock()}
      store={new SimpleStore(relay, {maxSize: 200})}
      height={10 + 4}
      width={4 + 6}
    />,
  );
  const start = unixNow() - 4;

  await sendEachSecond(relay, start, [0, 1, 5, 10]);

  // The basis spline through (-2,0), (0,1), (2,5), (4,10), its control points the thirds
  // and sixths between them, which d3-shape rounds to 3 decimals; 0.0005 px is invisible.
  // The oldest record is a second before the left edge, so it lies left of x = 0.
  assert.equal(
    container.querySelector(":scope svg path")?.getAttribute("d"),
    "M-2,0L-1.667,0.167C-1.333,0.333,-0.667,0.667,0,1.5C0.667,2.333,1.333,3.667,2,5.167C2.667,6.667,3.333,8.333,3.667,9.167L4,10",
  );
});

test("renders a correct qualitative range", async ({mount}) => {
  const relay = new Relay();
  const container = mount(
    <SparklineMicrochart
      clock={new Clock()}
      store={new SimpleStore(relay, {maxSize: 200})}
      height={10 + 4}
      width={4 + 6}
    />,
  );
  const start = unixNow() - 4;

  await sendEachSecond(relay, start, [0, 1, 5, 10]);

  // The middle four tenths of a height of 14, 0.4 × 14 in floating point, 1.5 short of a
  // width of 10.
  const rect = container.querySelector(":scope svg rect");
  assert.deepEqual(
    [rect?.getAttribute("y"), rect?.getAttribute("height"), rect?.getAttribute("width")],
    ["4.2", "5.6000000000000005", "8.5"],
  );
});

describe("at a fixed time", () => {
  test.override({now: 1_000_000 * 1000});

  test("places the current-value dot at the present when the newest record is old", async ({
    mount,
  }) => {
    const staleRelay = new Relay();
    const freshRelay = new Relay();
    const stale = mount(
      <SparklineMicrochart
        clock={new Clock()}
        store={new SimpleStore(staleRelay, {maxSize: 200})}
        height={14}
        width={36}
      />,
    );
    const fresh = mount(
      <SparklineMicrochart
        clock={new Clock()}
        store={new SimpleStore(freshRelay, {maxSize: 200})}
        height={14}
        width={36}
      />,
    );

    await act(() => {
      staleRelay.send([timedRecord({t: 999_990, v: 3})]);
      freshRelay.send([timedRecord({t: 1_000_000, v: 3})]);
    });

    assert.equal(
      stale.querySelector("circle")?.getAttribute("cx"),
      fresh.querySelector("circle")?.getAttribute("cx"),
    );
  });

  test("starts the line at the left edge when its oldest record is older than the chart", async ({
    mount,
  }) => {
    const relay = new Relay();
    const container = mount(
      <SparklineMicrochart
        clock={new Clock()}
        store={new SimpleStore(relay, {maxSize: 200})}
        height={14}
        width={36}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 999_980, v: 1}), timedRecord({t: 999_998, v: 5})]);
    });

    assert.match(
      container.querySelector(":scope svg path")?.getAttribute("d") ?? "",
      /^M0,/,
    );
  });

  test("leaves the current-value dot at a record exactly two seconds old", async ({
    mount,
  }) => {
    const recentRelay = new Relay();
    const freshRelay = new Relay();
    const recent = mount(
      <SparklineMicrochart
        clock={new Clock()}
        store={new SimpleStore(recentRelay, {maxSize: 200})}
        height={14}
        width={36}
      />,
    );
    const fresh = mount(
      <SparklineMicrochart
        clock={new Clock()}
        store={new SimpleStore(freshRelay, {maxSize: 200})}
        height={14}
        width={36}
      />,
    );

    await act(() => {
      recentRelay.send([timedRecord({t: 999_998, v: 3})]);
      freshRelay.send([timedRecord({t: 1_000_000, v: 3})]);
    });

    assert.notEqual(
      recent.querySelector("circle")?.getAttribute("cx"),
      fresh.querySelector("circle")?.getAttribute("cx"),
    );
  });

  // Twelve pixels hold four seconds, the last a second before now, over 6 pixels: the dot of
  // a record at now is at 8, then 2 pixels further left each second.
  test("redraws each second", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <SparklineMicrochart
        clock={new Clock()}
        store={new SimpleStore(relay, {maxSize: 200})}
        height={14}
        width={12}
      />,
    );
    await act(() => {
      relay.send([timedRecord({t: 1_000_000, v: 3})]);
    });

    await act(() => {
      vi.advanceTimersByTime(1000);
    });

    assert.equal(container.querySelector("circle")?.getAttribute("cx"), "6");
  });

  test("moves a silent channel's dot left until its next record", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <SparklineMicrochart
        clock={new Clock()}
        store={new SimpleStore(relay, {maxSize: 200})}
        height={14}
        width={12}
      />,
    );
    await act(() => {
      relay.send([timedRecord({t: 1_000_000, v: 3})]);
    });

    await act(() => {
      vi.advanceTimersByTime(3000);
    });

    assert.equal(container.querySelector("circle")?.getAttribute("cx"), "2");
  });
});
