import {assert, vi} from "vitest";

import {Clock} from "./clock.ts";
import {test} from "./test-helpers/fake-clock.ts";

test("keeps no timer while nothing listens", () => {
  new Clock();

  assert.equal(vi.getTimerCount(), 0);
});

test("tells a listener each second, with the new second already current", () => {
  vi.setSystemTime(1_790_620_000_000);
  const clock = new Clock();
  const seen: number[] = [];
  clock.subscribe(() => {
    seen.push(clock.get());
  });

  vi.advanceTimersByTime(2000);

  assert.deepEqual(seen, [1_790_620_001, 1_790_620_002]);
});

test("tells each of its listeners once a second", () => {
  const clock = new Clock();
  const calls: string[] = [];
  clock.subscribe(() => {
    calls.push("first");
  });
  clock.subscribe(() => {
    calls.push("second");
  });

  vi.advanceTimersByTime(1000);

  assert.deepEqual(calls, ["first", "second"]);
});

test("keeps ticking for the listeners still subscribed", () => {
  const clock = new Clock();
  const calls: string[] = [];
  const unsubscribe = clock.subscribe(() => {
    calls.push("first");
  });
  clock.subscribe(() => {
    calls.push("second");
  });

  unsubscribe();
  vi.advanceTimersByTime(1000);

  assert.deepEqual(calls, ["second"]);
});

test("clears its timer when the last listener unsubscribes", () => {
  const clock = new Clock();
  const unsubscribeFirst = clock.subscribe(vi.fn<() => void>());
  const unsubscribeSecond = clock.subscribe(vi.fn<() => void>());

  unsubscribeFirst();
  unsubscribeSecond();

  assert.equal(vi.getTimerCount(), 0);
});

test("ticks again for a listener that subscribes after the last one left", () => {
  const clock = new Clock();
  const unsubscribe = clock.subscribe(vi.fn<() => void>());
  unsubscribe();
  let ticks = 0;
  clock.subscribe(() => ticks++);

  vi.advanceTimersByTime(1000);

  assert.equal(ticks, 1);
});
