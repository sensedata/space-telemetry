import {curveBasis, line} from "d3-shape";

import type {ValuedRecord} from "../../records/valued-record.ts";
import type {LinearScale} from "./linear-scale.ts";

export type PlacedRecord = Pick<ValuedRecord, "t" | "v">;

/**
 * The SVG path of a basis spline over the records, rounded to 3 decimals, undefined for
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
