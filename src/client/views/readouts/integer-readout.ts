import {newestRecord} from "../../records/newest-record.ts";
import type {Reading} from "../../timed-record.ts";
import type {Readable} from "../../signals/readable.ts";
import type {View} from "../mount.ts";
import {span} from "./span.ts";

/** A channel's newest value rounded to an integer, or a dash for none. */
export function integerReadout(store: Readable<readonly Reading[]>): View {
  return {
    sources: [store],
    draw() {
      const v = newestRecord(store.get())?.v;

      return span(typeof v === "number" ? String(Math.round(v)) : "-");
    },
  };
}
