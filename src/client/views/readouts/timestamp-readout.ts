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
      const unixTime = newestRecord(store.get())?.t ?? 0;

      return span(unixTime === 0 ? "-" : formatUtcTime(unixTime));
    },
  };
}
