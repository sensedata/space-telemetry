import type {TimedRecord} from "../timed-record.ts";
import {arithmeticMean} from "./arithmetic-mean.ts";
import type {CombinedRecord} from "./combine-by-time.ts";
import {combineValuesAndMeans} from "./combine-values-and-means.ts";

export function average(channels: readonly (readonly TimedRecord[])[]): CombinedRecord[] {
  return combineValuesAndMeans(channels, arithmeticMean);
}
