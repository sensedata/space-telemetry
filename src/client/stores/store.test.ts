import {assert, describe, test, vi} from "vitest";

import {Store} from "./store.ts";

// Store leaves reading its state to each subclass.
class Door extends Store<{open: boolean; label: string}> {
  get() {
    return this.state;
  }
}

describe("Store", () => {
  test("holds the state it is constructed with", () => {
    const door = new Door({open: false, label: "hatch"});

    assert.deepEqual(door.get(), {open: false, label: "hatch"});
  });

  test("merges a patch into its state", () => {
    const door = new Door({open: false, label: "hatch"});

    door.setState({open: true});

    assert.deepEqual(door.get(), {open: true, label: "hatch"});
  });

  test("calls a listener at once, with the patch already merged", () => {
    const door = new Door({open: false, label: "hatch"});
    const seen: boolean[] = [];
    door.subscribe(() => {
      seen.push(door.get().open);
    });

    door.setState({open: true});

    assert.deepEqual(seen, [true]);
  });

  test("calls only the listeners still subscribed", () => {
    const door = new Door({open: false, label: "hatch"});
    const calls: string[] = [];
    const unsubscribe = door.subscribe(() => {
      calls.push("first");
    });
    door.subscribe(() => {
      calls.push("second");
    });

    unsubscribe();
    door.setState({open: true});

    assert.deepEqual(calls, ["second"]);
  });

  test("counts its listeners until they unsubscribe", () => {
    const door = new Door({open: false, label: "hatch"});
    const unsubscribe = door.subscribe(vi.fn<() => void>());
    door.subscribe(vi.fn<() => void>());

    unsubscribe();

    assert.equal(door.listenerCount(), 1);
  });
});
