import {curveBasis, line} from "d3-shape";

import type {TimedRecord} from "../../timed-record.ts";
import type {LinearScale} from "./linear-scale.ts";

export type PlacedRecord = Pick<TimedRecord, "t" | "v">;

/**
 * The SVG path of a basis spline through the records, rounded to 3 decimals, undefined for
 * none.
 */
export function sparklinePath(
  records: readonly PlacedRecord[],
  x: LinearScale,
  y: LinearScale,
): string | undefined {
  return (
    line<PlacedRecord>(
      (record) => x(record.t),
      (record) => y(record.v),
    ).curve(curveBasis)(records) ?? undefined
  );
}
