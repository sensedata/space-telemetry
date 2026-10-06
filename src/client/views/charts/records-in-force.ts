import type {TimedRecord} from "../../timed-record.ts";

/** For each of count seconds from earliest, the last record at or before it. */
export function recordsInForce<Held extends Pick<TimedRecord, "t">>(
  records: readonly Held[],
  earliest: number,
  count: number,
): (Held | undefined)[] {
  return Array.from({length: count}, (_, n) =>
    records.findLast((record) => record.t <= earliest + n),
  );
}
