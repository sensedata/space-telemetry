import type {TimedRecord} from "../timed-record.ts";
import {type CombinedRecord, combineByTime} from "./combine-by-time.ts";
import {maxDeviation} from "./max-deviation.ts";

export function deviation(
  channels: readonly (readonly TimedRecord[])[],
): CombinedRecord[] {
  return combineByTime(channels, (newest) => {
    const reported = newest.filter((record) => record !== undefined);
    return {
      v: maxDeviation(reported.map((record) => record.v)),
      vm: maxDeviation(reported.map((record) => record.vm)),
    };
  });
}
