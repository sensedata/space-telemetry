import type {TimedRecord} from "../timed-record.ts";

export type ValuedRecord = TimedRecord & {readonly v: number};

export function hasValue<Held extends Pick<TimedRecord, "v">>(
  record: Held,
): record is Held & {readonly v: number} {
  return record.v !== undefined;
}
