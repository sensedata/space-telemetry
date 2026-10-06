import type {VNode} from "preact";

import {newestRecord} from "../../stores/newest-record.ts";
import type {TimedRecord} from "../../timed-record.ts";
import {type Readable, useStore} from "../use-store.ts";
import {formatUtcTime} from "./format-utc-time.ts";

/** The UTC time of the newest record, or a dash before any. */
export function LastTransmissionReadout({
  store,
}: {
  store: Readable<readonly Pick<TimedRecord, "t">[]>;
}): VNode {
  const unixLast = newestRecord(useStore(store))?.t ?? 0;

  return <span>{unixLast > 0 ? formatUtcTime(unixLast) : "-"}</span>;
}
