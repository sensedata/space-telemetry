import {assert, describe} from "vitest";

import {signal} from "../../signals/signal.ts";
import type {TimedRecord} from "../../timed-record.ts";
import {test} from "../../test-helpers/mount.ts";

import {timedRecord} from "../../test-helpers/records.ts";
import {textReadout} from "./text-readout.ts";

describe("textReadout", () => {
  test("renders data received before mounting", ({mount}) => {
    const store = signal([timedRecord({t: 0, v: 4})]);

    const container = mount(textReadout({store, statuses: {4: "Reboost"}}));

    assert.equal(container.querySelector("span")?.textContent, "Reboost");
  });

  test("renders data received after mounting", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(
      textReadout({
        store,
        statuses: {4: "Reboost"},
      }),
    );

    store.set([timedRecord({t: 0, v: 4})]);

    assert.equal(container.querySelector("span")?.textContent, "Reboost");
  });
});
