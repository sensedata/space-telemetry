import {describe, expect, test} from "vitest";
import {feedTimeToUnix} from "./feed-time-to-unix.ts";

describe("feedTimeToUnix", () => {
  test.for([
    ["reads hour 24 as midnight on 1 January", 24, "2026-01-01T00:00:05Z", 1_767_225_600],
    [
      "reads half an hour past hour 24 as 00:30 on 1 January",
      24.5,
      "2026-01-01T00:31:00Z",
      1_767_227_400,
    ],
    [
      "reads an hour count below 24 as a time in the previous year",
      0.5,
      "2026-01-01T00:31:00Z",
      1_767_141_000,
    ],
    [
      "reads a mid-September hour count as that day and time",
      24 + 256 * 24 + 12.25,
      "2026-09-14T12:15:30Z",
      1_789_388_100,
    ],
    ["truncates a fraction of a second", 24.0004, "2026-01-01T00:00:05Z", 1_767_225_601],
    [
      "reads a 31 December hour count received just after the new year as the old year",
      24 + 364 * 24 + 23.75,
      "2026-01-01T00:00:10Z",
      1_767_224_700,
    ],
    [
      "reads day 366 of a leap year received in the next year as 31 December",
      24 + 365 * 24 + 23.75,
      "2025-01-01T02:32:37Z",
      1_735_688_700,
    ],
    [
      "reads a 1 January hour count received just before the new year as the new year",
      24.5,
      "2025-12-31T23:59:58Z",
      1_767_227_400,
    ],
    [
      "reads the first second past 2^31 - 1 unix seconds without wrapping",
      24 + 18 * 24 + 3 + 14 / 60 + 8 / 3600,
      "2038-01-19T03:15:00Z",
      2_147_483_648,
    ],
    [
      "reads a time in 2039 as positive unix seconds",
      24 + 59 * 24 + 6.5,
      "2039-03-01T06:31:00Z",
      2_182_573_800,
    ],
    ["yields NaN for NaN hours", NaN, "2026-01-01T00:00:05Z", NaN],
    ["yields Infinity for infinite hours", Infinity, "2026-01-01T00:00:05Z", Infinity],
    [
      "yields -Infinity for negatively infinite hours",
      -Infinity,
      "2026-01-01T00:00:05Z",
      -Infinity,
    ],
  ] as const)("%s", ([, hours, now, unix]) => {
    // toBe compares with Object.is, so a NaN row matches NaN.
    expect(feedTimeToUnix(hours, new Date(now))).toBe(unix);
  });
});
