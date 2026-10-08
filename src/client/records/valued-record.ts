import type {TimedRecord} from "../timed-record.ts";

export type ValuedRecord = TimedRecord & {readonly v: number};

export function hasValue(record: TimedRecord): record is ValuedRecord {
  return record.v !== undefined;
}
