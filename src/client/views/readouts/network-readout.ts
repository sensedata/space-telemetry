import {newestRecord} from "../../records/newest-record.ts";
import type {Readable} from "../../signals/readable.ts";
import type {View} from "../mount.ts";
import {span} from "./span.ts";
import {statusText} from "./status-text.ts";
import type {TextReadoutProps} from "./text-readout.ts";

/**
 * STATUS as a text readout, except that it reads Disconnected while the page's event stream
 * is lost, whatever STATUS last said, and No signal while the stream is up but STATUS says
 * the ISS feed has gone quiet.
 */
export function networkReadout({
  connection,
  store,
  statuses,
}: TextReadoutProps & {connection: Readable<boolean>}): View {
  return {
    sources: [connection, store],
    draw() {
      if (connection.get()) {
        return span("Disconnected");
      }

      const records = store.get();
      const noSignal = newestRecord(records)?.v === 0;
      return span(noSignal ? "No signal" : statusText(records, statuses));
    },
  };
}
