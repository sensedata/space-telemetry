import {assert, describe} from "vitest";

import {signal} from "../../signals/signal.ts";
import type {TimedRecord} from "../../timed-record.ts";
import {test} from "../../test-helpers/mount.ts";

import {timedRecord} from "../../test-helpers/records.ts";
import {networkReadout} from "./network-readout.ts";

describe("networkReadout", () => {
  test("reads Disconnected while the stream is lost, whatever STATUS last said", ({
    mount,
  }) => {
    const connection = signal(false);
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(
      networkReadout({
        connection,
        store,
        statuses: {0: "Disconnected", 1: "Connected"},
      }),
    );
    store.set([timedRecord({t: 10, v: 1, s: 24})]);

    connection.set(true);

    assert.equal(container.querySelector("span")?.textContent, "Disconnected");
  });

  test("reads STATUS again once the stream is back", ({mount}) => {
    const connection = signal(false);
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(
      networkReadout({
        connection,
        store,
        statuses: {0: "Disconnected", 1: "Connected"},
      }),
    );
    store.set([timedRecord({t: 10, v: 1, s: 24})]);
    connection.set(true);

    connection.set(false);

    assert.equal(container.querySelector("span")?.textContent, "Connected");
  });

  test("reads No signal while the stream is up and STATUS says the feed is down", ({
    mount,
  }) => {
    const store = signal<readonly TimedRecord[]>([]);
    const container = mount(
      networkReadout({
        connection: signal(false),
        store,
        statuses: {0: "Disconnected", 1: "Connected"},
      }),
    );

    store.set([timedRecord({t: 10, v: 0, s: 2})]);

    assert.equal(container.querySelector("span")?.textContent, "No signal");
  });
});
