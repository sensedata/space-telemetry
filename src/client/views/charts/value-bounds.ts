import type {TimedRecord} from "../../timed-record.ts";

export type ValueBounds = {readonly min: number; readonly max: number};

/**
 * The lowest and highest value of the records, a record without one counting as 0, where
 * linearScale draws it. Empty records give a min of Infinity and a max of -Infinity.
 */
export function valueBounds(records: readonly Pick<TimedRecord, "v">[]): ValueBounds {
  const values = records.map((record) => record.v ?? 0);
  return {min: Math.min(...values), max: Math.max(...values)};
}
