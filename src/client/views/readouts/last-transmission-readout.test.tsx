import {assert, describe} from "vitest";

import {Relay} from "../../relay.ts";
import {SimpleStore} from "../../stores/simple-store.ts";
import {test} from "../../test-helpers/mount.ts";

import {timedRecord} from "../../test-helpers/records.ts";
import {LastTransmissionReadout} from "./last-transmission-readout.tsx";

describe("LastTransmissionReadout", () => {
  test("renders the time of the newest record in UTC", ({mount}) => {
    const relay = new Relay();
    const store = new SimpleStore(relay, {maxSize: 200});
    relay.send([timedRecord({t: 1_790_619_990}), timedRecord({t: 1_790_620_000})]);

    const container = mount(<LastTransmissionReadout store={store} />);

    assert.equal(container.textContent, "18:26:40 2026.09.28");
  });

  test("renders a dash when it doesn't have data", ({mount}) => {
    const container = mount(
      <LastTransmissionReadout store={new SimpleStore(new Relay(), {maxSize: 200})} />,
    );

    assert.equal(container.textContent, "-");
  });

  test("renders a dash when the time is 0", ({mount}) => {
    const relay = new Relay();
    const store = new SimpleStore(relay, {maxSize: 200});
    relay.send([timedRecord({t: 0})]);

    const container = mount(<LastTransmissionReadout store={store} />);

    assert.equal(container.textContent, "-");
  });
});
