import {newestRecord} from "../../records/newest-record.ts";
import type {Reading} from "../../timed-record.ts";
import type {Readable} from "../../signals/readable.ts";
import type {View} from "../mount.ts";
import {formatUtcTime} from "./format-utc-time.ts";
import {span} from "./span.ts";

/** The UTC time of a channel's newest record, or a dash before any. */
export function timestampReadout(store: Readable<readonly Reading[]>): View {
  return {
    sources: [store],
    draw() {
      const newest = newestRecord(store.get());

      return span(newest === undefined || newest.t === 0 ? "-" : formatUtcTime(newest.t));
    },
  };
}
