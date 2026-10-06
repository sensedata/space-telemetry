import type {VNode} from "preact";

import {type Readable, useStore} from "../use-store.ts";
import {formatUtcTime} from "./format-utc-time.ts";

/** The clock's time, in UTC, redrawn each second. */
export function LocalTimeReadout({clock}: {clock: Readable<number>}): VNode {
  return <span>{formatUtcTime(useStore(clock))}</span>;
}
