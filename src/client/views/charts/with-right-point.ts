import type {TimedRecord} from "../../timed-record.ts";

/**
 * The records with the last carried forward to now where it is more than 2 seconds before
 * now. The feed sends a value only when it changes, as the server's Lightstreamer
 * subscription is in MERGE mode.
 */
export function withRightPoint<Held extends Pick<TimedRecord, "t">>(
  records: readonly Held[],
  now: number,
): readonly Held[] {
  const newest = records.at(-1);
  return newest !== undefined && now - newest.t > 2
    ? [...records, {...newest, t: now}]
    : records;
}
