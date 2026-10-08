import {assert, describe, test} from "vitest";

import {effect} from "./effect.ts";
import {signal} from "./signal.ts";

describe("an effect", () => {
  test("runs as soon as it starts", () => {
    const label = signal("hatch");
    const seen: string[] = [];

    effect([label], () => {
      seen.push(label.get());
    });

    assert.deepEqual(seen, ["hatch"]);
  });

  test("runs again on each change to any of its sources", () => {
    const label = signal("hatch");
    const count = signal(1);
    const seen: string[] = [];
    effect([label, count], () => {
      seen.push(`${label.get()} ${count.get()}`);
    });

    label.set("airlock");
    count.set(2);

    assert.deepEqual(seen, ["hatch 1", "airlock 1", "airlock 2"]);
  });

  test("stops following its sources once stopped", () => {
    const label = signal("hatch");
    const seen: string[] = [];
    const stop = effect([label], () => {
      seen.push(label.get());
    });

    stop();
    label.set("airlock");

    assert.deepEqual(seen, ["hatch"]);
  });
});
