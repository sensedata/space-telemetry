import type {VNode} from "preact";

import {newestRecord} from "../../stores/newest-record.ts";
import {type Readable, useStore} from "../use-store.ts";
import {statusText} from "./status-text.ts";
import type {TextReadoutProps} from "./text-readout.tsx";

/**
 * STATUS as a text readout, except that it reads Disconnected while the page's event stream
 * is lost, whatever STATUS last said, and No signal while the stream is up but STATUS says
 * the ISS feed has gone quiet.
 */
export function NetworkReadout({
  connection,
  store,
  telemetryNumber,
}: TextReadoutProps & {connection: Readable<boolean>}): VNode {
  const lost = useStore(connection);
  const records = useStore(store);

  if (lost) {
    return <span>Disconnected</span>;
  }
  const noSignal = newestRecord(records)?.v === 0;
  return <span>{noSignal ? "No signal" : statusText(records, telemetryNumber)}</span>;
}
