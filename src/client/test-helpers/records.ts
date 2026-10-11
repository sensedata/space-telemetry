import type {StreamRecord} from "../../contract/stream-record.ts";
import type {TimedRecord} from "../timed-record.ts";

// A USLAB000059 update as /events carries it.
const uslab000059: StreamRecord & TimedRecord = {
  k: "USLAB000059",
  v: 23.26,
  t: 1_789_212_189,
  s: 24,
};

// A whole record with `fields` in place of its own.
export function streamRecord(fields: Partial<StreamRecord>): StreamRecord {
  return {...uslab000059, ...fields};
}

// A whole record with `fields` in place of its own.
export function timedRecord(fields: Partial<TimedRecord>): TimedRecord {
  return {...uslab000059, ...fields};
}
