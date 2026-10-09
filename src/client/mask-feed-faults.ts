import type {TimedRecord} from "./timed-record.ts";

// The feed converts NODE3000011 to kilograms from a signed 16-bit count of 0.01 lbm. Its
// only value since 2022-11-01 is the count 0xCCCC, a memory fill pattern, so the match is
// on the count: the float it becomes arrives in more than one spelling.
const KILOGRAMS_PER_COUNT = 0.0045359237;
const FILL_COUNT = -13_108;

/**
 * The records with each known feed fill value as no value, which a readout shows as a dash
 * and a chart leaves out.
 *
 * FIXME [2026-10-31]: a stopgap until the page presents bad data in its own right. The server's mean,
 * vm, still counts the fill value.
 */
export function maskFeedFaults(records: readonly TimedRecord[]): TimedRecord[] {
  return records.map((record) =>
    isOxygenRateFill(record) ? {...record, v: undefined} : record,
  );
}

// Stays beside maskFeedFaults: a file of its own would export a predicate no other module
// reads, and the stopgap would span two files.
function isOxygenRateFill({k, v}: Pick<TimedRecord, "k" | "v">): boolean {
  return (
    k === "NODE3000011" &&
    v !== undefined &&
    Math.round(v / KILOGRAMS_PER_COUNT) === FILL_COUNT
  );
}
