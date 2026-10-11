import type {TimedRecord} from "../timed-record.ts";
import {type CombinedRecord, combineByTime} from "./combine-by-time.ts";

/**
 * combineByTime's records, each with v from combine over the values of the channels
 * reporting as of its time, and vm from combine over their means where every reporting
 * channel carries one.
 */
export function combineValuesAndMeans(
  channels: readonly (readonly TimedRecord[])[],
  combine: (values: readonly number[]) => number,
): CombinedRecord[] {
  return combineByTime(channels, (newest) => {
    const reported = newest.filter((record) => record !== undefined);
    const means = reported.map((record) => record.vm);
    return {
      v: combine(reported.map((record) => record.v)),
      ...(means.every((mean) => mean !== undefined) && {vm: combine(means)}),
    };
  });
}
