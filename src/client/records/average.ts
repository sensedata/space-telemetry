import type {TimedRecord} from "../timed-record.ts";
import {arithmeticMean} from "./arithmetic-mean.ts";
import {type CombinedRecord, combineByTime} from "./combine-by-time.ts";

export function average(channels: readonly (readonly TimedRecord[])[]): CombinedRecord[] {
  return combineByTime(channels, (newest) => {
    const reported = newest.filter((record) => record !== undefined);
    return {
      v: arithmeticMean(reported.map((record) => record.v)),
      vm: arithmeticMean(reported.map((record) => record.vm)),
    };
  });
}
