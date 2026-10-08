import {assert, test, vi} from "vitest";

import {formatUtcTime} from "./format-utc-time.ts";

test("formats in UTC when the local zone is not UTC", () => {
  vi.stubEnv("TZ", "Asia/Tokyo");

  assert.equal(formatUtcTime(1_790_620_000), "18:26:40 2026.09.28");
});

test("pads each field to two digits", () => {
  assert.equal(formatUtcTime(1_420_167_845), "03:04:05 2015.01.02");
});
