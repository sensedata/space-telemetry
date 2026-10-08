import type {ChannelName} from "../contract/channels.ts";
import * as channels from "../contract/channels.ts";
import type {StreamRecord} from "../contract/stream-record.ts";

// A stream record the client can place in time: its channel is of the data dictionary,
// its time is known, and its absent value is undefined rather than the wire's null.
export type TimedRecord = {
  readonly k: ChannelName;
  readonly v: number | undefined;
  readonly t: number;
  readonly s: number;
  readonly vm: number;
};

type NamedStreamRecord = StreamRecord & {readonly k: ChannelName};

const NAMES: ReadonlySet<string> = new Set(channels.names);
const NUMBER_FIELDS = ["s", "vm"];
// JSON writes NaN as null.
const NULLABLE_NUMBER_FIELDS = ["v", "t"];

function isNamedStreamRecord(value: unknown): value is NamedStreamRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const field = (name: string): unknown => Reflect.get(value, name);
  const k = field("k");
  return (
    typeof k === "string" &&
    NAMES.has(k) &&
    NUMBER_FIELDS.every((name) => typeof field(name) === "number") &&
    NULLABLE_NUMBER_FIELDS.every(
      (name) => field(name) === null || typeof field(name) === "number",
    )
  );
}

/**
 * The records of an /events event's data, less those without a time, which no chart or
 * latest value can place. Throws a TypeError when the data is not a list of records of
 * the data dictionary's channels.
 */
export function parseTimedRecords(data: string): TimedRecord[] {
  const records: unknown = JSON.parse(data);
  if (!Array.isArray(records) || !records.every(isNamedStreamRecord)) {
    throw new TypeError("an /events event's data is not a list of stream records");
  }
  return records.flatMap(({v, t, ...others}) =>
    t === null ? [] : [{...others, v: v ?? undefined, t}],
  );
}

// A record as a view reads it: the fields a channel's records and a combination's share.
export type Reading = Pick<TimedRecord, "t" | "v" | "vm">;
