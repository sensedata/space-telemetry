import {render} from "preact";
import {act} from "preact/test-utils";
import {assert, describe} from "vitest";

import {Store} from "../stores/store.ts";
import {test} from "../test-helpers/mount.ts";
import {useStore} from "./use-store.ts";

// Store leaves reading its state to each subclass.
class Door extends Store<{label: string}> {
  get() {
    return this.state;
  }
}

function DoorLabel({door}: {door: Door}) {
  return <span>{useStore(door).label}</span>;
}

function OptionalDoorLabel({door}: {door?: Door}) {
  return <span>{useStore(door)?.label ?? "no door"}</span>;
}

describe("a view bound with useStore", () => {
  test("shows the store's state when it mounts", ({mount}) => {
    const container = mount(<DoorLabel door={new Door({label: "hatch"})} />);

    assert.equal(container.textContent, "hatch");
  });

  test("shows each change to the store's state", async ({mount}) => {
    const door = new Door({label: "hatch"});
    const container = mount(<DoorLabel door={door} />);

    await act(() => {
      door.setState({label: "airlock"});
    });

    assert.equal(container.textContent, "airlock");
  });

  test("stops listening to the store when it unmounts", ({mount}) => {
    const door = new Door({label: "hatch"});
    const container = mount(<DoorLabel door={door} />);

    render(undefined, container);

    assert.equal(door.listenerCount(), 0);
  });

  test("moves its subscription to a store it is handed in place of the first", async ({
    mount,
  }) => {
    const first = new Door({label: "hatch"});
    const second = new Door({label: "airlock"});
    const container = mount(<DoorLabel door={first} />);

    await act(() => {
      render(<DoorLabel door={second} />, container);
    });

    assert.deepEqual([first.listenerCount(), second.listenerCount()], [0, 1]);
  });

  test("reads nothing when it has no store", ({mount}) => {
    const container = mount(<OptionalDoorLabel />);

    assert.equal(container.textContent, "no door");
  });
});
