import type {TimedRecord} from "../timed-record.ts";
import type {CombinedRecord} from "./combine-by-time.ts";
import {combineValuesAndMeans} from "./combine-values-and-means.ts";
import {maxDeviation} from "./max-deviation.ts";

export function deviation(
  channels: readonly (readonly TimedRecord[])[],
): CombinedRecord[] {
  return combineValuesAndMeans(channels, maxDeviation);
}
