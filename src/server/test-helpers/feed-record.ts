import type {FeedRecord} from "../feed-record.ts";

// A whole record, a USLAB000059 update as the Lightstreamer adapter emits it, with `fields`
// in place of its own.
export function feedRecord(fields: Partial<FeedRecord>): FeedRecord {
  return {
    k: "USLAB000059",
    v: 23.26046371459961,
    cv: "23.3",
    t: 1_789_212_189,
    s: 24,
    sid: 1_789_212_000_000,
    ...fields,
  };
}
