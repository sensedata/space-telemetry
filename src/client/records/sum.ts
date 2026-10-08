import {sum as total} from "d3-array";

import type {TimedRecord} from "../timed-record.ts";
import {type CombinedRecord, combineByTime} from "./combine-by-time.ts";

export function sum(channels: readonly (readonly TimedRecord[])[]): CombinedRecord[] {
  return combineByTime(channels, (newest) => {
    const reported = newest.filter((record) => record !== undefined);
    return {
      v: total(reported, (record) => record.v),
      vm: total(reported, (record) => record.vm),
    };
  });
}
