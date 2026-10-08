import {assert, describe, test} from "vitest";

import {signal} from "./signal.ts";

describe("a signal", () => {
  test("holds the value it starts with", () => {
    assert.equal(signal("hatch").get(), "hatch");
  });

  test("holds the value last set", () => {
    const label = signal("hatch");

    label.set("airlock");

    assert.equal(label.get(), "airlock");
  });

  test("tells each listener of a set, with the value already held", () => {
    const label = signal("hatch");
    const seen: string[] = [];
    label.subscribe(() => {
      seen.push(label.get());
    });
    label.subscribe(() => {
      seen.push(label.get().toUpperCase());
    });

    label.set("airlock");

    assert.deepEqual(seen, ["airlock", "AIRLOCK"]);
  });

  test("tells only the listeners still subscribed", () => {
    const label = signal("hatch");
    const calls: string[] = [];
    const unsubscribe = label.subscribe(() => {
      calls.push("first");
    });
    label.subscribe(() => {
      calls.push("second");
    });

    unsubscribe();
    label.set("airlock");

    assert.deepEqual(calls, ["second"]);
  });
});
