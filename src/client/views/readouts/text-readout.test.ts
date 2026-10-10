import {assert, describe} from "vitest";

import {signal} from "../../signals/signal.ts";
import type {TimedRecord} from "../../timed-record.ts";
import {test} from "../../test-helpers/mount.ts";

import {timedRecord} from "../../test-helpers/records.ts";
import {textReadout} from "./text-readout.ts";

describe("a text readout", () => {
  test("renders the status its channel's value names", ({mount}) => {
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
