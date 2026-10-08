import type {TimedRecord} from "../../timed-record.ts";

/**
 * For each of count seconds from earliest, the last record at or before it. Throws a
 * RangeError where a second has none: the records must hold one at or before earliest.
 */
export function recordsInForce<Held extends Pick<TimedRecord, "t">>(
  records: readonly Held[],
  earliest: number,
  count: number,
): Held[] {
  return Array.from({length: count}, (_, second) => {
    const record = records.findLast((held) => held.t <= earliest + second);
    if (record === undefined) {
      throw new RangeError(`no record in force ${second} seconds after ${earliest}`);
    }
    return record;
  });
}
