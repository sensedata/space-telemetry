import type {VNode} from "preact";

import {newestRecord} from "../../stores/newest-record.ts";
import type {Axis, EulerAngles} from "../../stores/quaternion-store.ts";
import type {TimedRecord} from "../../timed-record.ts";
import {type Readable, useStore} from "../use-store.ts";
import {padInteger} from "./pad-integer.ts";

type Format = {
  readonly conversion?: number | undefined;
  readonly scale?: number | undefined;
  readonly precision?: number;
  readonly negativePad?: boolean | undefined;
};

// A channel's newest value, or with eulerAxis, that axis of a quaternion's attitude.
export type DecimalReadoutProps = Format &
  (
    | {
        readonly store: Readable<readonly Pick<TimedRecord, "t" | "v">[]>;
        readonly eulerAxis?: undefined;
      }
    | {
        readonly store: Readable<readonly [EulerAngles]>;
        readonly eulerAxis: Exclude<Axis, "w">;
      }
  );

function rawValue(props: DecimalReadoutProps): number | undefined {
  return props.eulerAxis === undefined
    ? newestRecord(props.store.get())?.v
    : props.store.get()[0][props.eulerAxis];
}

/** The value converted, fixed to scale and padded per the props, or a dash for none. */
export function DecimalReadout(props: DecimalReadoutProps): VNode {
  // Binds either kind of store; rawValue reads the kind eulerAxis narrows it to.
  useStore<unknown>(props.store);
  const raw = rawValue(props);

  if (raw === undefined || !Number.isFinite(raw)) {
    return <span data-raw={raw}>-</span>;
  }

  const value = raw * (props.conversion ?? 1);
  const fixed = props.scale === undefined ? String(value) : value.toFixed(props.scale);
  const padded =
    props.precision === undefined ? fixed : padInteger(fixed, props.precision);
  const formatted =
    props.negativePad === true ? padded.replace(/^([^-])/, "\u{A0}$1") : padded;

  return <span data-raw={raw}>{formatted}</span>;
}
