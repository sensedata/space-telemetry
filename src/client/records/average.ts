import {sum} from "d3-array";

import type {TimedRecord} from "../timed-record.ts";
import {type CombinedRecord, combineByTime} from "./combine-by-time.ts";

export function average(channels: readonly (readonly TimedRecord[])[]): CombinedRecord[] {
  return combineByTime(channels, (newest) => {
    const reported = newest.filter((record) => record !== undefined);
    return {
      v: sum(reported, (record) => record.v) / reported.length,
      vm: sum(reported, (record) => record.vm) / reported.length,
    };
  });
}
