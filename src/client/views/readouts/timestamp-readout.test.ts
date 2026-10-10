import {assert, describe} from "vitest";

import {signal} from "../../signals/signal.ts";
import type {TimedRecord} from "../../timed-record.ts";
import {test} from "../../test-helpers/mount.ts";

import {timedRecord} from "../../test-helpers/records.ts";
import {timestampReadout} from "./timestamp-readout.ts";

describe("a timestamp readout", () => {
  test("renders the time of the newest record", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(timestampReadout(store));

    store.set([timedRecord({t: 1_790_619_990}), timedRecord({t: 1_790_620_000})]);

    assert.equal(container.textContent, "18:26:40 2026.09.28");
  });

  test("renders a dash when it doesn't have data", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(timestampReadout(store));

    assert.equal(container.querySelector("span")?.textContent, "-");
  });

  test("renders a dash when the time is 0", ({mount}) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(timestampReadout(store));

    store.set([timedRecord({t: 0})]);

    assert.equal(container.querySelector("span")?.textContent, "-");
  });
});
