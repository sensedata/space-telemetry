import type {Reading} from "../../timed-record.ts";
import type {Readable} from "../../signals/readable.ts";
import type {View} from "../mount.ts";
import {span} from "./span.ts";
import {type Statuses, statusText} from "./status-text.ts";

export type TextReadoutProps = {
  store: Readable<readonly Reading[]>;
  statuses: Statuses;
};

export function textReadout({store, statuses}: TextReadoutProps): View {
  return {
    sources: [store],
    draw: () => span(statusText(store.get(), statuses)),
  };
}
