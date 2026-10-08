import type {CombinedRecord} from "./combine-by-time.ts";

/**
 * The records each marked with the mean, as meanOf takes it, of v across them all, for a
 * combination whose mean is not a combination of its channels' means. bulletMicrochart
 * marks the chart at vm when given no marker.
 */
export function withHeldMean(
  records: readonly CombinedRecord[],
  meanOf: (values: readonly number[]) => number,
): CombinedRecord[] {
  const mean = meanOf(records.map((record) => record.v));
  return records.map((record) => ({...record, vm: mean}));
}
