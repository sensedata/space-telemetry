const HALF_YEAR_SECONDS = 183 * 24 * 3600;

/**
 * Converts an ISS feed TimeStamp to unix seconds. The TimeStamp is the day of the year,
 * counted from 1, times 24, plus the decimal hour of the day; it carries no year. The year
 * is `now`'s, unless that puts the reading more than half a year from `now`: then it is
 * the adjacent year nearer `now`. The result is truncated to whole seconds. NaN hours
 * yield NaN, and infinite hours yield the infinity of the same sign.
 */
export function feedTimeToUnix(hours: number, now: Date): number {
  const unixNow = now.getTime() / 1000;
  const clockYear = now.getUTCFullYear();
  const unixInYear = (year: number) =>
    Math.trunc((hours - 24) * 3600 + Date.UTC(year, 0) / 1000);
  const unixInClockYear = unixInYear(clockYear);

  if (unixInClockYear - unixNow > HALF_YEAR_SECONDS) {
    return unixInYear(clockYear - 1);
  }
  return unixNow - unixInClockYear > HALF_YEAR_SECONDS
    ? unixInYear(clockYear + 1)
    : unixInClockYear;
}
