import {assert, describe, vi} from "vitest";

import {startClock} from "./clock.ts";
import {test} from "../test-helpers/fake-clock.ts";

describe("a started clock", () => {
  test.override({now: 1_790_620_000_999});

  test("holds the current second, less its milliseconds", () => {
    assert.equal(startClock().get(), 1_790_620_000);
  });

  test("advances each second", () => {
    const clock = startClock();

    vi.advanceTimersByTime(2000);

    assert.equal(clock.get(), 1_790_620_002);
  });

  test("tells its listeners each second, with the new second already held", () => {
    const clock = startClock();
    const seen: number[] = [];
    clock.subscribe(() => {
      seen.push(clock.get());
    });

    vi.advanceTimersByTime(2000);

    assert.deepEqual(seen, [1_790_620_001, 1_790_620_002]);
  });
});
