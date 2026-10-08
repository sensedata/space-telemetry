import {range, sum} from "d3-array";

import type {TimedRecord} from "../timed-record.ts";
import {type CombinedRecord, combineByTime} from "./combine-by-time.ts";
import {withHeldMean} from "./with-held-mean.ts";

export type PowerPair<Channel> = {readonly volts: Channel; readonly amps: Channel};

/**
 * The watts of several supplies, each one's volts times its amps, added, at each time any
 * channel reported; channels holds each supply's volts then its amps. A supply counts once
 * both of its channels have reported, and until a supply counts there are no watts. The
 * mean of a product is not the product of the means, so each record marks the mean of the
 * watts held.
 */
export function power(channels: readonly (readonly TimedRecord[])[]): CombinedRecord[] {
  return withHeldMean(
    combineByTime(channels, (newest) => {
      const watts = range(0, newest.length, 2).flatMap((supply) => {
        const volts = newest[supply];
        const amps = newest[supply + 1];
        return volts && amps ? [volts.v * amps.v] : [];
      });
      return watts.length === 0 ? undefined : {v: sum(watts), vm: 0};
    }),
  );
}
