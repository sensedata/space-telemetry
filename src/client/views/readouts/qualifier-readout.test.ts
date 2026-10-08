import {assert} from "vitest";

import {signal} from "../../signals/signal.ts";
import type {TimedRecord} from "../../timed-record.ts";
import {test} from "../../test-helpers/mount.ts";
import {timedRecord} from "../../test-helpers/records.ts";
import {qualifierReadout} from "./qualifier-readout.ts";

test("renders nothing before its channel reports", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const container = mount(
    qualifierReadout({
      store,
      statuses: {3: "Russian"},
    }),
  );

  assert.equal(container.textContent, "");
});

test("renders the status behind a separator once its channel reports", ({mount}) => {
  const store = signal<readonly TimedRecord[]>([]);
  const container = mount(
    qualifierReadout({
      store,
      statuses: {3: "Russian"},
    }),
  );

  store.set([timedRecord({t: 0, v: 3})]);

  assert.equal(container.textContent, " - Russian");
});

test("renders nothing for the 0 its channel's dictionary leaves out", ({mount}) => {
  const store = signal([timedRecord({t: 0, v: 0})]);

  const container = mount(qualifierReadout({store, statuses: {1: "Standard"}}));

  assert.equal(container.textContent, "");
});
