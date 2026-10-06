import type {VNode} from "preact";

import type {TimedRecord} from "../../timed-record.ts";
import {type Readable, useStore} from "../use-store.ts";
import {statusText} from "./status-text.ts";

export type TextReadoutProps = {
  store: Readable<readonly Pick<TimedRecord, "t" | "v">[]>;
  telemetryNumber: number | undefined;
};

/** The status the channel's dictionary gives its newest value. */
export function TextReadout({store, telemetryNumber}: TextReadoutProps): VNode {
  return <span>{statusText(useStore(store), telemetryNumber)}</span>;
}
