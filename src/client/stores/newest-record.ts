import type {TimedRecord} from "../timed-record.ts";

/**
 * The record with the latest time, or undefined for none; within a second, the later
 * arrival, as when STATUS turns connected in the second it was reported disconnected.
 */
export function newestRecord<Held extends Pick<TimedRecord, "t">>(
  records: readonly Held[],
): Held | undefined {
  let newest = records[0];
  for (const record of records) {
    if (newest === undefined || record.t >= newest.t) {
      newest = record;
    }
  }
  return newest;
}
