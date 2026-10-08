import type {TimedRecord} from "../../timed-record.ts";
import {withLeftPoint} from "./with-left-point.ts";
import {withRightPoint} from "./with-right-point.ts";

const PIXELS_PER_POINT = 3;

export type ChartWindow<Held> = {
  readonly availablePoints: number;
  readonly earliest: number;
  // The records with withLeftPoint's point at earliest, and withRightPoint's at now where
  // it adds one.
  readonly records: readonly Held[];
};

/**
 * The availablePoints seconds before now that a chart width pixels wide draws, one point
 * each PIXELS_PER_POINT pixels.
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
