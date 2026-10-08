import {assert, describe} from "vitest";

import {signal} from "../signals/signal.ts";
import {test} from "../test-helpers/mount.ts";
import {mount, type View} from "./mount.ts";
import {span} from "./readouts/span.ts";

// A door's label, or nothing for a door without one.
function doorLabel(label: ReturnType<typeof signal<string>>): View {
  return {
    sources: [label],
    draw() {
      return label.get() === "" ? undefined : span(label.get());
    },
  };
}

describe("a mounted view", () => {
  test("shows what it draws from its source's value when it mounts", ({mount}) => {
    const container = mount(doorLabel(signal("hatch")));

    assert.equal(container.textContent, "hatch");
  });

  test("shows each change to its source's value", ({mount}) => {
    const label = signal("hatch");
    const container = mount(doorLabel(label));

    label.set("airlock");

    assert.equal(container.textContent, "airlock");
  });

  test("replaces what its container held", () => {
    const container = document.createElement("div");
    container.append(span("stowaway"));

    mount(doorLabel(signal("hatch")), container);

    assert.equal(container.textContent, "hatch");
  });

  test("empties its container once the view draws nothing", ({mount}) => {
    const label = signal("hatch");
    const container = mount(doorLabel(label));

    label.set("");

    assert.equal(container.innerHTML, "");
  });

  test("empties its container and stops following its source when it unmounts", () => {
    const label = signal("hatch");
    const container = document.createElement("div");
    const unmount = mount(doorLabel(label), container);

    unmount();
    label.set("airlock");

    assert.equal(container.innerHTML, "");
  });
});
