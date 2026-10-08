import {extent} from "d3-array";

import type {TimedRecord} from "../../timed-record.ts";
import type {ValueBounds} from "./linear-scale.ts";

/**
 * The lowest and highest value, less the records without one; undefined where none has
 * one.
 */
export function valueExtent(
  records: readonly Pick<TimedRecord, "v">[],
): ValueBounds | undefined {
  const [min, max] = extent(records, (record) => record.v);
  return min === undefined ? undefined : {min, max};
}
