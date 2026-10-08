import {newestRecord} from "../../records/newest-record.ts";
import type {Reading} from "../../timed-record.ts";
import type {Readable} from "../../signals/readable.ts";
import type {View} from "../mount.ts";
import {span} from "./span.ts";

export type DecimalReadoutProps = {
  readonly store: Readable<readonly Reading[]>;
  readonly conversion?: number | undefined;
  readonly scale?: number | undefined;
  readonly negativePad?: boolean | undefined;
};

/** The newest value converted, fixed to scale and padded per negativePad, or a dash for none. */
export function decimalReadout(props: DecimalReadoutProps): View {
  return {
    sources: [props.store],
    draw() {
      const raw = newestRecord(props.store.get())?.v;
      if (raw === undefined || !Number.isFinite(raw)) {
        return span("-");
      }

      const value = raw * (props.conversion ?? 1);
      const fixed =
        props.scale === undefined ? String(value) : value.toFixed(props.scale);
      const formatted =
        props.negativePad === true ? fixed.replace(/^([^-])/, "\u{A0}$1") : fixed;

      return span(formatted);
    },
  };
}
