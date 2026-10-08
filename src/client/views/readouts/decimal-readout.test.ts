import {assert, describe} from "vitest";

import {signal} from "../../signals/signal.ts";
import type {TimedRecord} from "../../timed-record.ts";
import {test} from "../../test-helpers/mount.ts";

import {timedRecord} from "../../test-helpers/records.ts";
import {decimalReadout} from "./decimal-readout.ts";

describe("decimalReadout", () => {
  test("renders data received before mounting", ({mount}) => {
    const store = signal([timedRecord({t: 0, v: 9.7816348761234})]);

    const container = mount(decimalReadout({store}));

    assert.equal(container.querySelector("span")?.textContent, "9.7816348761234");
  });

  test("renders data received after mounting", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(decimalReadout({store: store}));

    store.set([timedRecord({t: 0, v: 9.7816348761234})]);

    assert.equal(container.querySelector("span")?.textContent, "9.7816348761234");
  });

  test("renders a dash when it doesn't have data", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(decimalReadout({store}));

    assert.equal(container.querySelector("span")?.textContent, "-");
  });

  test("rounds to scale", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(decimalReadout({store, scale: 3}));

    store.set([timedRecord({t: 0, v: 9.7816348761234})]);

    assert.equal(container.querySelector("span")?.textContent, "9.782");
  });

  test("shows the value in the converted unit", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(decimalReadout({store, conversion: 1.5}));

    store.set([timedRecord({t: 0, v: 2})]);

    assert.equal(container.textContent, "3");
  });

  test("rounds the converted value to scale", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(
      decimalReadout({
        store,
        conversion: 277.777778,
        scale: 1,
      }),
    );

    store.set([timedRecord({t: 0, v: 0.5})]);

    assert.equal(container.textContent, "138.9");
  });

  test("renders the later of two records within the same second", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(decimalReadout({store, scale: 2}));

    store.set([
      timedRecord({t: 10, v: 0.09765625, s: 24}),
      timedRecord({t: 10, v: 0.19921875, s: 24}),
    ]);

    assert.equal(container.querySelector("span")?.textContent, "0.20");
  });

  test.for([
    [
      "pads a positive value with a no-break space where a sign would be",
      1.5,
      "\u{A0}1.500",
    ],
    ["leaves a negative value unpadded", -1.5, "-1.500"],
  ] as const)("with negative padding, %s", ([, value, expected], {mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(
      decimalReadout({
        store,
        negativePad: true,
        scale: 3,
      }),
    );

    store.set([timedRecord({t: 0, v: value})]);

    assert.equal(container.textContent, expected);
  });
});
