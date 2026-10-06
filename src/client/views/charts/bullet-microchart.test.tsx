import {act} from "preact/test-utils";
import {assert, describe} from "vitest";

import {Relay} from "../../relay.ts";
import {SimpleStore} from "../../stores/simple-store.ts";
import {test} from "../../test-helpers/mount.ts";

import {timedRecord} from "../../test-helpers/records.ts";
import {BulletMicrochart} from "./bullet-microchart.tsx";

describe("BulletMicrochart", () => {
  test("renders nothing without data", ({mount}) => {
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(new Relay(), {maxSize: 200})}
        capacity={2}
        height={10}
        width={100}
      />,
    );

    assert.equal(container.innerHTML, "");
  });

  test("sets its size to that of its container", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacity={2}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1, vm: 0.5})]);
    });

    const svg = container.querySelector("svg");
    assert.deepEqual(
      [svg?.getAttribute("height"), svg?.getAttribute("width")],
      ["10", "100"],
    );
  });

  test("renders the full-range element with measure and static capacity", async ({
    mount,
  }) => {
    const relay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacity={2}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1})]);
    });

    assert.equal(
      container.querySelector(":scope svg rect.range-3")?.getAttribute("width"),
      "100",
    );
  });

  test("renders the full-range element with measure and store-based capacity", async ({
    mount,
  }) => {
    const relay = new Relay();
    const capacityRelay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacityStore={new SimpleStore(capacityRelay, {maxSize: 200})}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1, vm: 0.5})]);
      capacityRelay.send([timedRecord({t: 0, v: 2})]);
    });

    assert.equal(
      container.querySelector(":scope svg rect.range-3")?.getAttribute("width"),
      "100",
    );
  });

  test("renders the measure element", async ({mount}) => {
    const relay = new Relay();
    const capacityRelay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacityStore={new SimpleStore(capacityRelay, {maxSize: 200})}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1, vm: 0.5})]);
      capacityRelay.send([timedRecord({t: 0, v: 2})]);
    });

    const measure = container.querySelector(":scope svg line.measure");
    assert.deepEqual(
      [measure?.getAttribute("x1"), measure?.getAttribute("x2")],
      ["0", "50"],
    );
  });

  test("updates the measure element", async ({mount}) => {
    const relay = new Relay();
    const capacityRelay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacityStore={new SimpleStore(capacityRelay, {maxSize: 200})}
        height={10}
        width={100}
      />,
    );
    await act(() => {
      relay.send([timedRecord({t: 0, v: 1, vm: 0.5})]);
      capacityRelay.send([timedRecord({t: 0, v: 2})]);
    });

    await act(() => {
      relay.send([timedRecord({t: 1, v: 1.5})]);
    });

    const measure = container.querySelector(":scope svg line.measure");
    assert.deepEqual(
      [measure?.getAttribute("x1"), measure?.getAttribute("x2")],
      ["0", "75"],
    );
  });

  test("renders the marker element at the mean if unspecified", async ({mount}) => {
    const relay = new Relay();
    const capacityRelay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacityStore={new SimpleStore(capacityRelay, {maxSize: 200})}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1, vm: 0.5})]);
      capacityRelay.send([timedRecord({t: 0, v: 2})]);
    });

    const marker = container.querySelector(":scope svg line.marker");
    assert.deepEqual(
      [marker?.getAttribute("x1"), marker?.getAttribute("x2")],
      ["25", "25"],
    );
  });

  test("renders the marker element at negative mean", async ({mount}) => {
    const relay = new Relay();
    const capacityRelay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacityStore={new SimpleStore(capacityRelay, {maxSize: 200})}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1, vm: -0.5})]);
      capacityRelay.send([timedRecord({t: 0, v: 2})]);
    });

    const marker = container.querySelector(":scope svg line.marker");
    assert.deepEqual(
      [marker?.getAttribute("x1"), marker?.getAttribute("x2")],
      ["25", "25"],
    );
  });

  test("renders the marker element as specified", async ({mount}) => {
    const relay = new Relay();
    const capacityRelay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacityStore={new SimpleStore(capacityRelay, {maxSize: 200})}
        marker={0.75}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1, vm: 0.5})]);
      capacityRelay.send([timedRecord({t: 0, v: 2})]);
    });

    const marker = container.querySelector(":scope svg line.marker");
    assert.deepEqual(
      [marker?.getAttribute("x1"), marker?.getAttribute("x2")],
      ["37.5", "37.5"],
    );
  });

  test("applies the conversion to the measure", async ({mount}) => {
    const relay = new Relay();
    const capacityRelay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacityStore={new SimpleStore(capacityRelay, {maxSize: 200})}
        conversion={2}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1, vm: 0.5})]);
      capacityRelay.send([timedRecord({t: 0, v: 2})]);
    });

    assert.equal(
      container.querySelector(":scope svg line.measure")?.getAttribute("x2"),
      "100",
    );
  });

  test("applies the conversion to the mean marker", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacity={2}
        conversion={2}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1, vm: 0.5})]);
    });

    const marker = container.querySelector(":scope svg line.marker");
    assert.deepEqual(
      [marker?.getAttribute("x1"), marker?.getAttribute("x2")],
      ["50", "50"],
    );
  });

  test("leaves a specified marker unconverted", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacity={2}
        marker={0.75}
        conversion={2}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1, vm: 0.5})]);
    });

    const marker = container.querySelector(":scope svg line.marker");
    assert.deepEqual(
      [marker?.getAttribute("x1"), marker?.getAttribute("x2")],
      ["37.5", "37.5"],
    );
  });

  test("takes a conversion of 0 as none for the mean marker", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacity={2}
        conversion={0}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1, vm: 0.5})]);
    });

    const marker = container.querySelector(":scope svg line.marker");
    assert.deepEqual(
      [marker?.getAttribute("x1"), marker?.getAttribute("x2")],
      ["25", "25"],
    );
  });

  test("renders a negative measure", async ({mount}) => {
    const relay = new Relay();
    const capacityRelay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacityStore={new SimpleStore(capacityRelay, {maxSize: 200})}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: -1, vm: 0.5})]);
      capacityRelay.send([timedRecord({t: 0, v: 2})]);
    });

    const measure = container.querySelector(":scope svg line.measure");
    assert.deepEqual(
      [measure?.getAttribute("x1"), measure?.getAttribute("x2")],
      ["0", "50"],
    );
  });

  test("renders nothing without a capacity", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1, vm: 0.5})]);
    });

    assert.equal(container.querySelectorAll("svg").length, 0);
  });

  test("renders nothing while only the capacity has arrived", async ({mount}) => {
    const capacityRelay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(new Relay(), {maxSize: 200})}
        capacityStore={new SimpleStore(capacityRelay, {maxSize: 200})}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      capacityRelay.send([timedRecord({t: 0, v: 2})]);
    });

    assert.equal(container.querySelectorAll("svg").length, 0);
  });

  test("renders nothing while its capacity channel holds no record", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacityStore={new SimpleStore(new Relay(), {maxSize: 200})}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1, vm: 0.5})]);
    });

    assert.equal(container.querySelectorAll("svg").length, 0);
  });

  test("measures the later of two records within the same second", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacity={4}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([
        timedRecord({t: 10, v: 1, vm: 0.5}),
        timedRecord({t: 10, v: 2, vm: 0.5}),
      ]);
    });

    assert.equal(
      container.querySelector(":scope svg line.measure")?.getAttribute("x2"),
      "50",
    );
  });

  test("scales the measure to the newest capacity", async ({mount}) => {
    const relay = new Relay();
    const capacityRelay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacityStore={new SimpleStore(capacityRelay, {maxSize: 200})}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1, vm: 0.5})]);
      capacityRelay.send([timedRecord({t: 0, v: 2}), timedRecord({t: 1, v: 4})]);
    });

    assert.equal(
      container.querySelector(":scope svg line.measure")?.getAttribute("x2"),
      "25",
    );
  });

  test("draws every range at no width while its capacity record has no value", async ({
    mount,
  }) => {
    const relay = new Relay();
    const capacityRelay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacityStore={new SimpleStore(capacityRelay, {maxSize: 200})}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1, vm: 0.5})]);
      capacityRelay.send([timedRecord({t: 0, v: undefined})]);
    });

    assert.equal(
      container.querySelector(":scope svg rect.range-3")?.getAttribute("width"),
      "0",
    );
  });

  test("bands its qualitative ranges at three quarters, half and a quarter of capacity", async ({
    mount,
  }) => {
    const relay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacity={2}
        height={10}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1})]);
    });

    const widths = ["range-2", "range-1", "range-0"].map((range) =>
      container.querySelector(`:scope svg rect.${range}`)?.getAttribute("width"),
    );
    assert.deepEqual(widths, ["75", "50", "25"]);
  });

  test("draws the measure across the vertical centre", async ({mount}) => {
    const relay = new Relay();
    const capacityRelay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacityStore={new SimpleStore(capacityRelay, {maxSize: 200})}
        height={20}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1, vm: 0.5})]);
      capacityRelay.send([timedRecord({t: 0, v: 2})]);
    });

    const measure = container.querySelector(":scope svg line.measure");
    assert.deepEqual(
      [measure?.getAttribute("y1"), measure?.getAttribute("y2")],
      ["10", "10"],
    );
  });

  test("draws the marker over the middle seven tenths of the height", async ({mount}) => {
    const relay = new Relay();
    const capacityRelay = new Relay();
    const container = mount(
      <BulletMicrochart
        store={new SimpleStore(relay, {maxSize: 200})}
        capacityStore={new SimpleStore(capacityRelay, {maxSize: 200})}
        height={20}
        width={100}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 1, vm: 0.5})]);
      capacityRelay.send([timedRecord({t: 0, v: 2})]);
    });

    const marker = container.querySelector(":scope svg line.marker");
    assert.deepEqual(
      [marker?.getAttribute("y1"), marker?.getAttribute("y2")],
      ["3", "17"],
    );
  });
});
