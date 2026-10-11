import {sum as total} from "d3-array";

import type {TimedRecord} from "../timed-record.ts";
import type {CombinedRecord} from "./combine-by-time.ts";
import {combineValuesAndMeans} from "./combine-values-and-means.ts";

export function sum(channels: readonly (readonly TimedRecord[])[]): CombinedRecord[] {
  return combineValuesAndMeans(channels, (values) => total(values));
}
