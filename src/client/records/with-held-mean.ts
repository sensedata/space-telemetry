import {sum} from "d3-array";

import type {CombinedRecord} from "./combine-by-time.ts";

/**
 * The records each marked with the mean of v across them all, for a combination whose
 * mean is not a combination of its channels' means. bulletMicrochart marks the chart at vm
 * when given no marker.
 */
export function withHeldMean(records: readonly CombinedRecord[]): CombinedRecord[] {
  const mean = sum(records, (record) => record.v) / records.length;
  return records.map((record) => ({...record, vm: mean}));
}
