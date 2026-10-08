import {newestRecord} from "../../records/newest-record.ts";
import type {Reading} from "../../timed-record.ts";

// The status a channel's each value names.
export type Statuses = Readonly<Record<number, string>>;

/**
 * The status the table gives the newest record's value: a dash before any record, and
 * Unknown for a value the table leaves out. A table that leaves out 0 gives it a dash: the
 * feed sends 0 between two statuses, and as a placeholder before the first.
 */
export function statusText(records: readonly Reading[], statuses: Statuses): string {
  const newest = newestRecord(records);
  if (newest === undefined) {
    return "-";
  }
  const {v} = newest;
  if (v === undefined) {
    return "Unknown";
  }
  return statuses[v] ?? (v === 0 ? "-" : "Unknown");
}
