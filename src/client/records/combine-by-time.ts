import type {TimedRecord} from "../timed-record.ts";
import {CHART_POINTS} from "./chart-points.ts";
import {hasValue, type ValuedRecord} from "./valued-record.ts";

export type CombinedRecord = {
  readonly t: number;
  readonly v: number;
  readonly vm: number;
};

/**
 * One record per time any channel reported, the newest CHART_POINTS of them, each from the
 * channels' newest records as of its time, undefined for a channel yet to report. A record
 * without a value is no report. combine returns undefined where the records combine to no
 * reading, and that time has no record.
 */
export function combineByTime(
  channels: readonly (readonly TimedRecord[])[],
  combine: (
    newest: readonly (ValuedRecord | undefined)[],
  ) => Omit<CombinedRecord, "t"> | undefined,
): CombinedRecord[] {
  const valued = channels.map((records) => records.filter(hasValue));
  const times = [...new Set(valued.flat().map((record) => record.t))]
    .toSorted((a, b) => a - b)
    .slice(-CHART_POINTS);

  return times.flatMap((t) => {
    const combined = combine(
      valued.map((records) => records.findLast((record) => record.t <= t)),
    );
    return combined === undefined ? [] : [{...combined, t}];
  });
}
