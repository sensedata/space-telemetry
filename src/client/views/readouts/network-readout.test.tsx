import {render} from "preact";
import {act} from "preact/test-utils";
import {assert, describe} from "vitest";

import * as channels from "../../../contract/channels.ts";
import {Relay} from "../../relay.ts";
import {ConnectionStore} from "../../stores/connection-store.ts";
import {SimpleStore} from "../../stores/simple-store.ts";
import {test} from "../../test-helpers/mount.ts";

import {timedRecord} from "../../test-helpers/records.ts";
import {NetworkReadout} from "./network-readout.tsx";

describe("NetworkReadout", () => {
  test("reads Disconnected while the stream is lost, whatever STATUS last said", async ({
    mount,
  }) => {
    const connection = new ConnectionStore();
    const relay = new Relay();
    const container = mount(
      <NetworkReadout
        connection={connection}
        store={new SimpleStore(relay, {maxSize: 200})}
        telemetryNumber={channels.numbers.STATUS}
      />,
    );
    await act(() => {
      relay.send([timedRecord({t: 10, v: 1, s: 24})]);
    });

    await act(() => {
      connection.setState({lost: true});
    });

    assert.equal(container.querySelector("span")?.textContent, "Disconnected");
  });

  test("reads STATUS again once the stream is back", async ({mount}) => {
    const connection = new ConnectionStore();
    const relay = new Relay();
    const container = mount(
      <NetworkReadout
        connection={connection}
        store={new SimpleStore(relay, {maxSize: 200})}
        telemetryNumber={channels.numbers.STATUS}
      />,
    );
    await act(() => {
      relay.send([timedRecord({t: 10, v: 1, s: 24})]);
      connection.setState({lost: true});
    });

    await act(() => {
      connection.setState({lost: false});
    });

    assert.equal(container.querySelector("span")?.textContent, "Connected");
  });

  test("reads No signal while the stream is up and STATUS says the feed is down", async ({
    mount,
  }) => {
    const relay = new Relay();
    const container = mount(
      <NetworkReadout
        connection={new ConnectionStore()}
        store={new SimpleStore(relay, {maxSize: 200})}
        telemetryNumber={channels.numbers.STATUS}
      />,
    );

    await act(() => {
      relay.send([timedRecord({t: 10, v: 0, s: 2})]);
    });

    assert.equal(container.querySelector("span")?.textContent, "No signal");
  });

  test("stops listening to the connection once unmounted", ({mount}) => {
    const connection = new ConnectionStore();
    const container = mount(
      <NetworkReadout
        connection={connection}
        store={new SimpleStore(new Relay(), {maxSize: 200})}
        telemetryNumber={channels.numbers.STATUS}
      />,
    );

    render(undefined, container);

    assert.equal(connection.listenerCount(), 0);
  });
});
