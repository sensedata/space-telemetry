import {act} from "preact/test-utils";
import {assert, describe, vi} from "vitest";

import {Clock} from "../../clock.ts";
import {test} from "../../test-helpers/fake-clock.ts";
import {LocalTimeReadout} from "./local-time-readout.tsx";

describe("LocalTimeReadout", () => {
  test.override({now: 1_790_620_000_000});

  test("shows the UTC time as soon as it mounts", ({mount}) => {
    const container = mount(<LocalTimeReadout clock={new Clock()} />);

    assert.equal(container.textContent, "18:26:40 2026.09.28");
  });

  test("advances the time each second", async ({mount}) => {
    const container = mount(<LocalTimeReadout clock={new Clock()} />);

    await act(() => {
      vi.advanceTimersByTime(3000);
    });

    assert.equal(container.textContent, "18:26:43 2026.09.28");
  });
});
