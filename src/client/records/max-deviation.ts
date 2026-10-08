import {sum} from "d3-array";

export function maxDeviation(values: readonly number[]): number {
  const mean = sum(values) / values.length;
  return Math.max(...values.map((value) => Math.abs(value - mean)));
}
