import type {VNode} from "preact";

import {newestRecord} from "../../stores/newest-record.ts";
import type {TimedRecord} from "../../timed-record.ts";
import {type Readable, useStore} from "../use-store.ts";
import {formatUtcTime} from "./format-utc-time.ts";

/** The UTC time of a channel's newest record, or a dash before any. */
export function TimestampReadout({
  store,
}: {
  store: Readable<readonly Pick<TimedRecord, "t">[]>;
}): VNode {
  const unixTime = newestRecord(useStore(store))?.t ?? 0;

  return <span>{unixTime === 0 ? "-" : formatUtcTime(unixTime)}</span>;
}
