import type {Reading} from "../../timed-record.ts";
import type {Readable} from "../../signals/readable.ts";
import type {View} from "../mount.ts";
import {span} from "./span.ts";
import {type Statuses, statusText} from "./status-text.ts";

export type QualifierReadoutProps = {
  store: Readable<readonly Reading[]>;
  statuses: Statuses;
};

/**
 * The channel's status behind a separator, to qualify the text the readout follows, or
 * nothing while the status reads a dash.
 */
export function qualifierReadout({store, statuses}: QualifierReadoutProps): View {
  return {
    sources: [store],
    draw() {
      const status = statusText(store.get(), statuses);
      return span(status === "-" ? "" : ` - ${status}`);
    },
  };
}
