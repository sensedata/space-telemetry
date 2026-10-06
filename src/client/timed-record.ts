import type {StreamRecord} from "../contract/stream-record.ts";

// A stream record the client can place in time, its absent value undefined. A nullable wire
// field other than v fails the build at parseTimedRecords.
export type TimedRecord = {
  readonly [Field in keyof StreamRecord]:
    | NonNullable<StreamRecord[Field]>
    | (Field extends "v" ? undefined : never);
};

const NUMBER_FIELDS = ["k", "s", "vm"];
// JSON writes NaN as null.
const NULLABLE_NUMBER_FIELDS = ["v", "t"];

function isStreamRecord(value: unknown): value is StreamRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const field = (name: string): unknown => Reflect.get(value, name);
  return (
    NUMBER_FIELDS.every((name) => typeof field(name) === "number") &&
    NULLABLE_NUMBER_FIELDS.every(
      (name) => field(name) === null || typeof field(name) === "number",
    )
  );
}

/**
 * The records of an /events event's data, less those without a time, which no chart or
 * latest value can place.
 */
export function parseTimedRecords(data: string): TimedRecord[] {
  const records: unknown = JSON.parse(data);
  if (!Array.isArray(records) || !records.every(isStreamRecord)) {
    throw new TypeError("an /events event's data is not a list of stream records");
  }
  return records.flatMap(({v, t, ...others}) =>
    t === null ? [] : [{...others, v: v ?? undefined, t}],
  );
}
