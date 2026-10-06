import type {TimedRecord} from "../timed-record.ts";

export type ValuedRecord = TimedRecord & {readonly v: number};

/** Whether the record carries a value. */
export function hasValue(record: TimedRecord): record is ValuedRecord {
  return record.v !== undefined;
}
