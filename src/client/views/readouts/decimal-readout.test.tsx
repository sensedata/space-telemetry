import {act} from "preact/test-utils";
import {assert, describe} from "vitest";

import {Relay} from "../../relay.ts";
import {QuaternionStore} from "../../stores/quaternion-store.ts";
import {SimpleStore} from "../../stores/simple-store.ts";
import {test} from "../../test-helpers/mount.ts";

import {timedRecord} from "../../test-helpers/records.ts";
import {DecimalReadout} from "./decimal-readout.tsx";

describe("DecimalReadout", () => {
  test("renders data received before mounting", ({mount}) => {
    const relay = new Relay();
    const store = new SimpleStore(relay, {maxSize: 200});
    relay.send([timedRecord({t: 0, v: 9.7816348761234})]);

    const container = mount(<DecimalReadout store={store} />);

    assert.equal(container.querySelector("span")?.textContent, "9.7816348761234");
  });

  test("renders data received after mounting", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <DecimalReadout store={new SimpleStore(relay, {maxSize: 200})} />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 9.7816348761234})]);
    });

    assert.equal(container.querySelector("span")?.textContent, "9.7816348761234");
  });

  test("renders a dash when it doesn't have data", ({mount}) => {
    const container = mount(
      <DecimalReadout store={new SimpleStore(new Relay(), {maxSize: 200})} />,
    );

    assert.equal(container.querySelector("span")?.textContent, "-");
  });

  test("renders the euler axis of quaternions", async ({mount}) => {
    const axes = {x: new Relay(), y: new Relay(), z: new Relay(), w: new Relay()};
    const container = mount(
      <DecimalReadout store={new QuaternionStore(axes)} eulerAxis="z" scale={2} />,
    );

    // A quarter turn about z: yaw 90 degrees, pitch and roll 0.
    await act(() => {
      axes.x.send([timedRecord({t: 0, v: 0})]);
      axes.y.send([timedRecord({t: 0, v: 0})]);
      axes.z.send([timedRecord({t: 0, v: Math.SQRT1_2})]);
      axes.w.send([timedRecord({t: 0, v: Math.SQRT1_2})]);
    });

    assert.equal(container.querySelector("span")?.textContent, "90.00");
  });

  test("renders a dash when it has a null euler from an empty quaternion", ({mount}) => {
    const axes = {x: new Relay(), y: new Relay(), z: new Relay(), w: new Relay()};
    const container = mount(
      <DecimalReadout store={new QuaternionStore(axes)} eulerAxis="x" />,
    );

    assert.equal(container.querySelector("span")?.textContent, "-");
  });

  test("rounds to scale", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <DecimalReadout store={new SimpleStore(relay, {maxSize: 200})} scale={3} />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 9.7816348761234})]);
    });

    assert.equal(container.querySelector("span")?.textContent, "9.782");
  });

  test("pads to the left with zeros with precision", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <DecimalReadout store={new SimpleStore(relay, {maxSize: 200})} precision={3} />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 9.7816348761234})]);
    });

    assert.equal(container.querySelector("span")?.textContent, "009.7816348761234");
  });

  test("shows the value in the converted unit", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <DecimalReadout store={new SimpleStore(relay, {maxSize: 200})} conversion={1.5} />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 2})]);
    });

    assert.equal(container.textContent, "3");
  });

  test("rounds the converted value to scale", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <DecimalReadout
        store={new SimpleStore(relay, {maxSize: 200})}
        conversion={277.777778}
        scale={1}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 0.5})]);
    });

    assert.equal(container.textContent, "138.9");
  });

  test("renders the later of two records within the same second", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <DecimalReadout store={new SimpleStore(relay, {maxSize: 200})} scale={2} />,
    );

    await act(() => {
      relay.send([
        timedRecord({t: 10, v: 0.09765625, s: 24}),
        timedRecord({t: 10, v: 0.19921875, s: 24}),
      ]);
    });

    assert.equal(container.querySelector("span")?.textContent, "0.20");
  });

  test("rounds and pads together", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <DecimalReadout
        store={new SimpleStore(relay, {maxSize: 200})}
        precision={3}
        scale={3}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 9.7816348761234})]);
    });

    assert.equal(container.querySelector("span")?.textContent, "009.782");
  });

  test.for([
    [
      "pads a positive value with a no-break space where a sign would be",
      1.5,
      "\u{A0}1.500",
    ],
    ["leaves a negative value unpadded", -1.5, "-1.500"],
  ] as const)("with negative padding, %s", async ([, value, expected], {mount}) => {
    const relay = new Relay();
    const container = mount(
      <DecimalReadout
        store={new SimpleStore(relay, {maxSize: 200})}
        negativePad
        scale={3}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: value})]);
    });

    assert.equal(container.textContent, expected);
  });
});
