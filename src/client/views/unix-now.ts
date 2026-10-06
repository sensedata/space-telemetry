/**
 * The current Unix time in whole seconds, floored as the feed's record times are, so the
 * charts' per-second windows line up with the records.
 */
export function unixNow(): number {
  return Math.floor(Date.now() / 1000);
}
