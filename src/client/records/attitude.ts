import {Euler, MathUtils, Quaternion} from "three";

import type {TimedRecord} from "../timed-record.ts";
import {circularMean} from "./circular-mean.ts";
import {type CombinedRecord, combineByTime} from "./combine-by-time.ts";
import {withHeldMean} from "./with-held-mean.ts";

// Roll is about x, pitch about y and yaw about z.
export type Axis = "x" | "y" | "z";

/**
 * The Euler angle about the axis, in degrees, of the attitude the quaternion of four
 * channels gives, at each time any channel reported; channels holds x, y, z then w. A
 * time before every component has a value has no record, and a component keeps its value
 * until a record with one arrives. Each record marks the circular mean of the angles held:
 * an arithmetic mean of angles either side of the turn from 180 to -180, as roll is
 * through a flip, is no direction. The function it returns throws a RangeError for other
 * than four channels.
 */
export function attitude(
  axis: Axis,
): (channels: readonly (readonly TimedRecord[])[]) => CombinedRecord[] {
  return (channels) => {
    if (channels.length !== 4) {
      throw new RangeError(`a quaternion is four channels, not ${channels.length}`);
    }

    return withHeldMean(
      combineByTime(channels, ([x, y, z, w]) => {
        if (x === undefined || y === undefined || z === undefined || w === undefined) {
          return;
        }

        // The answer at https://space.stackexchange.com/a/22423/18909 reads USLAB000018,
        // component 0, as the real part w, which is why index.html lists it last, and the
        // ISS reports its angles as yaw, pitch then roll, hence ZYX.
        const euler = new Euler().setFromQuaternion(
          new Quaternion(x.v, y.v, z.v, w.v).normalize(),
          "ZYX",
        );
        return {v: MathUtils.radToDeg(euler[axis]), vm: 0};
      }),
      circularMean,
    );
  };
}
