import {sum} from "d3-array";

export function arithmeticMean(values: readonly number[]): number {
  return sum(values) / values.length;
}
