import type {VNode} from "preact";

import type {TimedRecord} from "../../timed-record.ts";
import {type Readable, useStore} from "../use-store.ts";
import {statusText} from "./status-text.ts";

export type QualifierReadoutProps = {
  store: Readable<readonly Pick<TimedRecord, "t" | "v">[]>;
  telemetryNumber: number | undefined;
};

/**
 * The channel's status behind a separator, to qualify the text the readout follows, or
 * nothing while the status reads a dash.
 */
export function QualifierReadout({store, telemetryNumber}: QualifierReadoutProps): VNode {
  const status = statusText(useStore(store), telemetryNumber);
  return <span>{status === "-" ? "" : ` - ${status}`}</span>;
}
