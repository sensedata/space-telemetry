import {scaleLinear} from "d3-scale";

import type {TimedRecord} from "../../timed-record.ts";

export type ValueBounds = {readonly min: number; readonly max: number};

export type LinearScale = (value: TimedRecord["v"]) => number;

/**
 * Maps the domain onto 0 to length, and a value outside the domain beyond that range. An
 * undefined value counts as 0. A domain of one value maps every value to 0, where d3-scale
 * would map it to the middle of the length.
 */
export function linearScale(domain: ValueBounds, length: number): LinearScale {
  if (domain.min === domain.max) {
    return () => 0;
  }
  // d3-scale maps NaN to undefined by default, which LinearScale's number return would hide.
  const scale = scaleLinear([domain.min, domain.max], [0, length]).unknown(NaN);
  return (value) => scale(value ?? 0);
}
