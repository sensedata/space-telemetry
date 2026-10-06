// Each record of an event's data, an array as the stream carries it, reduced to `fields`. A
// field a record lacks reads as undefined, so a strict comparison still catches it.
export function pickFields(data: unknown, fields: readonly string[]): unknown[] {
  if (!Array.isArray(data)) {
    throw new TypeError("the event data is not an array of records");
  }
  return data.map((record: unknown) =>
    Object.fromEntries(
      fields.map((field) => [
        field,
        typeof record === "object" && record !== null
          ? Reflect.get(record, field)
          : undefined,
      ]),
    ),
  );
}
