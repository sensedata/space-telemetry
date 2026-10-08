import {arithmeticMean} from "./arithmetic-mean.ts";

export function maxDeviation(values: readonly number[]): number {
  const mean = arithmeticMean(values);
  return Math.max(...values.map((value) => Math.abs(value - mean)));
}
