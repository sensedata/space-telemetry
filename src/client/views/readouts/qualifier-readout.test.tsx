import {act} from "preact/test-utils";
import {assert} from "vitest";

import * as channels from "../../../contract/channels.ts";
import {Relay} from "../../relay.ts";
import {SimpleStore} from "../../stores/simple-store.ts";
import {test} from "../../test-helpers/mount.ts";
import {timedRecord} from "../../test-helpers/records.ts";
import {QualifierReadout} from "./qualifier-readout.tsx";

test("renders nothing before its channel reports", ({mount}) => {
  const container = mount(
    <QualifierReadout
      store={new SimpleStore(new Relay())}
      telemetryNumber={channels.numbers.USLAB000013}
    />,
  );

  assert.equal(container.textContent, "");
});

test("renders the status behind a separator once its channel reports", async ({
  mount,
}) => {
  const relay = new Relay();
  const container = mount(
    <QualifierReadout
      store={new SimpleStore(relay)}
      telemetryNumber={channels.numbers.USLAB000013}
    />,
  );

  await act(() => {
    relay.send([timedRecord({t: 0, v: 3})]);
  });

  assert.equal(container.textContent, " - Russian");
});

test("renders nothing for the 0 its channel's dictionary leaves out", ({mount}) => {
  const relay = new Relay();
  const store = new SimpleStore(relay);
  relay.send([timedRecord({t: 0, v: 0})]);

  const container = mount(
    <QualifierReadout store={store} telemetryNumber={channels.numbers.USLAB000086} />,
  );

  assert.equal(container.textContent, "");
});
