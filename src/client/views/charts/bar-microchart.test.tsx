import {act} from "preact/test-utils";
import {assert, describe} from "vitest";

import {Relay} from "../../relay.ts";
import {SimpleStore} from "../../stores/simple-store.ts";
import {test} from "../../test-helpers/fake-clock.ts";
import {timedRecord} from "../../test-helpers/records.ts";
import {sendEachSecond} from "../../test-helpers/send-each-second.ts";
import {unixNow} from "../unix-now.ts";
import {BarMicrochart} from "./bar-microchart.tsx";

// Each bar's x, y and height.
function barsOf(container: Element) {
  return [...container.querySelectorAll(":scope svg rect")].map((bar) => [
    bar.getAttribute("x"),
    bar.getAttribute("y"),
    bar.getAttribute("height"),
  ]);
}

test("renders nothing without data", ({mount}) => {
  const container = mount(
    <BarMicrochart
      store={new SimpleStore(new Relay(), {maxSize: 200})}
      height={10}
      width={100}
    />,
  );

  assert.equal(container.innerHTML, "");
});

test("renders nothing when its channel's backfill holds no records", async ({mount}) => {
  const relay = new Relay();
  const container = mount(
    <BarMicrochart
      store={new SimpleStore(relay, {maxSize: 200})}
      height={10}
      width={100}
    />,
  );

  await act(() => {
    relay.send([]);
  });

  assert.equal(container.innerHTML, "");
});

test("sets its size to that of its container", async ({mount}) => {
  const relay = new Relay();
  const container = mount(
    <BarMicrochart
      store={new SimpleStore(relay, {maxSize: 200})}
      height={10}
      width={100}
    />,
  );

  await act(() => {
    relay.send([timedRecord({t: 0, v: 0})]);
  });

  const svg = container.querySelector("svg");
  assert.deepEqual(
    [svg?.getAttribute("height"), svg?.getAttribute("width")],
    ["10", "100"],
  );
});

test("draws one bar per three pixels of width", async ({mount}) => {
  const relay = new Relay();
  const container = mount(
    <BarMicrochart
      store={new SimpleStore(relay, {maxSize: 200})}
      height={10}
      width={9 + 2}
    />,
  );

  await act(() => {
    relay.send([timedRecord({t: 0, v: 0})]);
  });

  assert.equal(container.querySelectorAll(":scope svg rect").length, 3);
});

test("draws a simple set of points correctly", async ({mount}) => {
  const relay = new Relay();
  const container = mount(
    <BarMicrochart
      store={new SimpleStore(relay, {maxSize: 200})}
      height={10}
      width={12}
    />,
  );
  const start = unixNow() - 4;

  await sendEachSecond(relay, start, [0, 1, 5, 10]);

  assert.deepEqual(barsOf(container), [
    ["0", "10", "0"],
    ["3", "9", "1"],
    ["6", "5", "5"],
    ["9", "0", "10"],
  ]);
});

test("add a left-most point if there isn't one in the data", async ({mount}) => {
  const relay = new Relay();
  const container = mount(
    <BarMicrochart
      store={new SimpleStore(relay, {maxSize: 200})}
      height={10}
      width={12}
    />,
  );
  const start = unixNow() - 3;

  await sendEachSecond(relay, start, [0, 5, 10]);

  assert.deepEqual(barsOf(container), [
    ["0", "10", "0"],
    ["3", "10", "0"],
    ["6", "5", "5"],
    ["9", "0", "10"],
  ]);
});

test("adds a right-most point if the newest data is old", async ({mount}) => {
  const relay = new Relay();
  const container = mount(
    <BarMicrochart
      store={new SimpleStore(relay, {maxSize: 200})}
      height={10}
      width={12}
    />,
  );
  const start = unixNow() - 4;

  await sendEachSecond(relay, start, [0, 5, 10]);

  assert.deepEqual(barsOf(container), [
    ["0", "10", "0"],
    ["3", "5", "5"],
    ["6", "0", "10"],
    ["9", "0", "10"],
  ]);
});

test("scales bars between the min and max it is given", async ({mount}) => {
  const relay = new Relay();
  const container = mount(
    <BarMicrochart
      store={new SimpleStore(relay, {maxSize: 200})}
      min={10}
      max={110}
      height={10}
      width={100}
    />,
  );

  await act(() => {
    relay.send([timedRecord({t: 0, v: 60})]);
  });

  const bar = container.querySelector(":scope svg rect:first-child");
  assert.deepEqual([bar?.getAttribute("y"), bar?.getAttribute("height")], ["5", "5"]);
});

test("anchors its bars at a given min of 0", async ({mount}) => {
  const relay = new Relay();
  const container = mount(
    <BarMicrochart
      store={new SimpleStore(relay, {maxSize: 200})}
      min={0}
      max={100}
      height={10}
      width={100}
    />,
  );

  await act(() => {
    relay.send([timedRecord({t: 0, v: 50})]);
  });

  assert.equal(
    container.querySelector(":scope svg rect:first-child")?.getAttribute("height"),
    "5",
  );
});

describe("at a fixed time", () => {
  test.override({now: 1_000_000 * 1000});

  test("marks the bar at a record's own second as a real point", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <BarMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        height={10}
        width={12}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 999_996, v: 5})]);
    });

    assert.equal(
      container.querySelector(":scope svg rect:nth-child(1)")?.getAttribute("class"),
      "bar real-point",
    );
  });

  test.for([
    ["marks the bar a second after a record's own as a real point", 2, true],
    ["draws the bar two seconds after a record's own as a plain bar", 3, false],
  ] as const)("%s", async ([, position, realPoint], {mount}) => {
    const relay = new Relay();
    const container = mount(
      <BarMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        height={10}
        width={12}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 999_996, v: 5})]);
    });

    const bar = container.querySelector(`:scope svg rect:nth-child(${position})`);
    assert.equal(bar?.classList.contains("real-point"), realPoint);
  });

  test("draws a bar carried forward from an older record as a plain bar", async ({
    mount,
  }) => {
    const relay = new Relay();
    const container = mount(
      <BarMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        height={10}
        width={12}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 999_996, v: 5})]);
    });

    assert.equal(
      container.querySelector(":scope svg rect:nth-child(4)")?.getAttribute("class"),
      "bar",
    );
  });

  test("leaves the store's records as it found them", async ({mount}) => {
    const relay = new Relay();
    const store = new SimpleStore(relay, {maxSize: 200});
    mount(<BarMicrochart store={store} height={10} width={12} />);

    await act(() => {
      relay.send([timedRecord({t: 999_990, v: 5})]);
    });

    assert.deepEqual(store.get(), [timedRecord({t: 999_990, v: 5})]);
  });
});
