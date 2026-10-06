import {assert, vi} from "vitest";
import {newSessionId} from "./session-id.ts";
import {test} from "./test-helpers/fake-clock.ts";

test("a session id is the millisecond it was taken", () => {
  vi.setSystemTime(new Date("2026-09-12T11:20:00.250Z"));

  assert.equal(newSessionId(), 1_789_212_000_250);
});
