/**
 * Milliseconds from transmitted, a record's Unix time in seconds, to now, in milliseconds
 * since the epoch; negative when the record's time is after now.
 */
export function transmissionDelay(transmitted: number, now: number): number {
  return now - transmitted * 1000;
}
