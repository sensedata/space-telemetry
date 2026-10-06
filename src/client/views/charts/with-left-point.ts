import type {TimedRecord} from "../../timed-record.ts";

/**
 * The records with the one in force at earliest, the left edge of a chart, moved there, or a
 * copy of the oldest placed there if none is, so the chart always starts with a point.
 * Records before the one in force stay.
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
