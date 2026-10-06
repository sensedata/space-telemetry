import {Duration} from "luxon";

/**
 * Formats milliseconds as hh:mm:ss with total hours, not wrapped at a day. The milliseconds
 * drop toward zero, and a negative duration takes one leading sign.
 */
export function formatDuration(milliseconds: number): string {
  // Luxon's toFormat signs each unit of a negative duration and floors its seconds, so it
  // is given the magnitude.
  const magnitude = Duration.fromMillis(Math.abs(milliseconds)).toFormat("hh:mm:ss");
  return milliseconds < 0 ? `-${magnitude}` : magnitude;
}
