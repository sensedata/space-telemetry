import {assert, describe, vi} from "vitest";

import {startClock} from "../../signals/clock.ts";
import {test} from "../../test-helpers/fake-clock.ts";
import {groundTimeReadout} from "./ground-time-readout.ts";

describe("groundTimeReadout", () => {
  test.override({now: 1_790_620_000_000});

  test("shows the UTC time as soon as it mounts", ({mount}) => {
    const container = mount(groundTimeReadout(startClock()));

    assert.equal(container.textContent, "18:26:40 2026.09.28");
  });

  test("advances the time each second", ({mount}) => {
    const container = mount(groundTimeReadout(startClock()));

    vi.advanceTimersByTime(3000);

    assert.equal(container.textContent, "18:26:43 2026.09.28");
  });
});
