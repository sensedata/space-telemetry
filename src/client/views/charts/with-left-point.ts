import type {TimedRecord} from "../../timed-record.ts";

/**
 * The records with a point at earliest, the left edge of a chart. The record in force at
 * earliest moves there, and the records before it stay. Where none is in force, a copy of
 * the oldest goes there. No records give none.
 */
export function withLeftPoint<Held extends Pick<TimedRecord, "t">>(
  records: readonly Held[],
  earliest: number,
): readonly Held[] {
  const left = records.findLastIndex((record) => record.t <= earliest);
  if (left === -1) {
    const [oldest] = records;
    return oldest === undefined ? [] : [{...oldest, t: earliest}, ...records];
  }
  return records.map((record, index) =>
    index === left ? {...record, t: earliest} : record,
  );
}
