import type {TimedRecord} from "../../timed-record.ts";
import {withLeftPoint} from "./with-left-point.ts";
import {withRightPoint} from "./with-right-point.ts";

const PIXELS_PER_POINT = 3;

// The seconds a chart width pixels wide draws, one point a second, ending at now.
export type ChartWindow<Held> = {
  readonly availablePoints: number;
  readonly earliest: number;
  // The records with a point at each edge of the window.
  readonly records: readonly Held[];
};

/**
 * The window of a chart width pixels wide that ends at now, its records given a point at
 * each edge.
 */
export function chartWindow<Held extends Pick<TimedRecord, "t">>(
  records: readonly Held[],
  width: number,
  now: number,
): ChartWindow<Held> {
  const availablePoints = Math.floor(width / PIXELS_PER_POINT);
  const earliest = now - availablePoints;
  return {
    availablePoints,
    earliest,
    records: withRightPoint(withLeftPoint(records, earliest), now),
  };
}
