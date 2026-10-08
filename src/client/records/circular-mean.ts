import {sum} from "d3-array";

const RADIANS = Math.PI / 180;

/** The mean direction, in degrees from -180 to 180, of angles in degrees. */
export function circularMean(degrees: readonly number[]): number {
  return (
    Math.atan2(
      sum(degrees, (angle) => Math.sin(angle * RADIANS)),
      sum(degrees, (angle) => Math.cos(angle * RADIANS)),
    ) / RADIANS
  );
}
