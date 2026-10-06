// What Lightstreamer's getValue returns for a field of an update: its text, or null when the
// update carries no such field.
export type FieldValue = string | null;

// A telemetry record as the source carries it and the buffer holds it.
export type FeedRecord = {
  // The channel's number in the data dictionary.
  readonly k: number;
  readonly v: number;
  // Lightstreamer's CalibratedData; the source's own STATUS records carry none.
  readonly cv?: FieldValue;
  // Unix seconds.
  readonly t: number;
  // The ISS feed's status class.
  readonly s: number;
  // The session id, in milliseconds since the epoch, which tells apart the records of
  // separate telemetry subscriptions.
  readonly sid: number;
};

const NUMERIC_FIELDS = ["k", "v", "t", "s", "sid"];

/** Accepts a parsed value whose numeric fields are numbers and whose cv is absent, null or text. */
export function isFeedRecord(value: unknown): value is FeedRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const cv: unknown = Reflect.get(value, "cv");
  return (
    NUMERIC_FIELDS.every((field) => typeof Reflect.get(value, field) === "number") &&
    (cv === undefined || cv === null || typeof cv === "string")
  );
}
