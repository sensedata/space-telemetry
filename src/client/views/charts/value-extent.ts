import {extent} from "d3-array";

import type {ValuedRecord} from "../../records/valued-record.ts";
import type {ValueBounds} from "./linear-scale.ts";

/**
 * The lowest and highest value, undefined for no records.
 */
export function valueExtent(
  records: readonly Pick<ValuedRecord, "v">[],
): ValueBounds | undefined {
  const [min, max] = extent(records, (record) => record.v);
  return min === undefined ? undefined : {min, max};
}
