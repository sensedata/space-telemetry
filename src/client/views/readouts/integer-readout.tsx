import type {VNode} from "preact";

import {newestRecord} from "../../stores/newest-record.ts";
import type {TimedRecord} from "../../timed-record.ts";
import {type Readable, useStore} from "../use-store.ts";

/** A channel's newest value rounded to an integer, or a dash for none. */
export function IntegerReadout({
  store,
}: {
  store: Readable<readonly Pick<TimedRecord, "t" | "v">[]>;
}): VNode {
  const v = newestRecord(useStore(store))?.v;

  return <span>{typeof v === "number" ? Math.round(v) : "-"}</span>;
}
