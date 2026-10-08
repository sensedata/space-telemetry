import type {TimedRecord} from "../timed-record.ts";

/**
 * Whether two records are one: the server resends a channel's backfill on every reconnect,
 * and isSame in src/server/buffer.ts treats records equal in value, time and status as one
 * record.
 */
export function isSameRecord(a: TimedRecord, b: TimedRecord): boolean {
  return a.v === b.v && a.t === b.t && a.s === b.s;
}
