import type {TimedRecord} from "../timed-record.ts";
import {CHART_POINTS} from "./chart-points.ts";
import {isSameRecord} from "./is-same-record.ts";

/**
 * A channel's records once an event's records arrive: the held and the arrivals not among
 * them, oldest first, the newest CHART_POINTS of them. toSorted is stable, so within a
 * second an arrival follows a held record and newestRecord takes it as the newer.
 */
export function mergeRecords(
  held: readonly TimedRecord[],
  arrived: readonly TimedRecord[],
): TimedRecord[] {
  const fresh = arrived.filter((record) => held.every((h) => !isSameRecord(h, record)));
  return [...held, ...fresh].toSorted((a, b) => a.t - b.t).slice(-CHART_POINTS);
}
