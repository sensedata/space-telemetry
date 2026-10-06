import {act} from "preact/test-utils";
import {assert, describe} from "vitest";

import * as channels from "../../../contract/channels.ts";
import {Relay} from "../../relay.ts";
import {SimpleStore} from "../../stores/simple-store.ts";
import {test} from "../../test-helpers/mount.ts";

import {timedRecord} from "../../test-helpers/records.ts";
import {TextReadout} from "./text-readout.tsx";

describe("TextReadout", () => {
  test("renders data received before mounting", ({mount}) => {
    const relay = new Relay();
    const store = new SimpleStore(relay, {maxSize: 200});
    relay.send([timedRecord({t: 0, v: 4})]);

    const container = mount(
      <TextReadout store={store} telemetryNumber={channels.numbers.USLAB000086} />,
    );

    assert.equal(container.querySelector("span")?.textContent, "Reboost");
  });

  test("renders data received after mounting", async ({mount}) => {
    const relay = new Relay();
    const container = mount(
      <TextReadout
        store={new SimpleStore(relay, {maxSize: 200})}
        telemetryNumber={channels.numbers.USLAB000086}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 0, v: 4})]);
    });

    assert.equal(container.querySelector("span")?.textContent, "Reboost");
  });
});
