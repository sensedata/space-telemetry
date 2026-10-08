import type {TimedRecord} from "../timed-record.ts";
import {arithmeticMean} from "./arithmetic-mean.ts";
import {circularMean} from "./circular-mean.ts";
import {type CombinedRecord, combineByTime} from "./combine-by-time.ts";
import {withHeldMean} from "./with-held-mean.ts";

// How a channel's sensor is mounted: a negated angle counts the other way round, and a
// turned one starts half a turn away.
export type Mounting = {readonly negated: boolean; readonly turned: boolean};

// A channel that carries an angle in degrees, and its mounting.
export type MirroredAngle<Channel> = Mounting & {readonly channel: Channel};

// The degrees between two angles, the short way round. It stays in this file because a
// reader following the deviation would leave it for three lines.
function apart(a: number, b: number): number {
  return Math.abs(((((a - b) % 360) + 540) % 360) - 180);
}

/**
 * The largest distance of any one angle from the mean direction of them all, each angle
 * first corrected for its mounting, at each time any channel reported; mountings[i] is the
 * mounting of channels[i]. A channel's vm is an arithmetic mean, which is no direction for
 * angles that straddle 0, so each record marks the mean of the deviations held.
 */
export function angleDeviation(
  channels: readonly (readonly TimedRecord[])[],
  mountings: readonly Mounting[],
): CombinedRecord[] {
  return withHeldMean(
    combineByTime(channels, (newest) => {
      const degrees = mountings.flatMap(({negated, turned}, channel) => {
        const record = newest[channel];
        return record ? [(negated ? -record.v : record.v) + (turned ? 180 : 0)] : [];
      });
      const mean = circularMean(degrees);
      return {v: Math.max(...degrees.map((angle) => apart(angle, mean))), vm: 0};
    }),
    arithmeticMean,
  );
}
