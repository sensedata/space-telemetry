import type {TimedRecord} from "../../timed-record.ts";

/**
 * The records with the last carried forward to now where it is more than 2 seconds before
 * now, as the feed sends a value only when it changes.
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
