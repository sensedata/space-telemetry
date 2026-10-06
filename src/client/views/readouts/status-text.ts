import {newestRecord} from "../../stores/newest-record.ts";
import type {TimedRecord} from "../../timed-record.ts";
import {statusDictionary} from "../status-dictionary.ts";

/**
 * The status the channel's dictionary gives the newest record's value: a dash before any
 * record, and Unknown for a value, or a channel, the dictionaries leave out. A dictionary
 * that leaves out 0 gives it a dash: the feed sends 0 between two statuses, and as a
 * placeholder before the first.
 */
export function statusText(
  records: readonly Pick<TimedRecord, "t" | "v">[],
  telemetryNumber: number | undefined,
): string {
  const newest = newestRecord(records);
  if (newest === undefined) {
    return "-";
  }
  const {v} = newest;
  const statuses =
    telemetryNumber === undefined ? undefined : statusDictionary[telemetryNumber];
  if (v === undefined || statuses === undefined) {
    return "Unknown";
  }
  return statuses[v] ?? (v === 0 ? "-" : "Unknown");
}
