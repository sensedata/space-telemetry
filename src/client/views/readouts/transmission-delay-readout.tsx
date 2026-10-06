import type {VNode} from "preact";

import type {TimedRecord} from "../../timed-record.ts";
import {type Readable, useStore} from "../use-store.ts";
import {formatDuration} from "./format-duration.ts";
import {transmissionDelay} from "./transmission-delay.ts";

const ALARM_MS = 30_000;

type TransmissionDelayReadoutProps = {
  clock: Readable<number>;
  store: Readable<readonly Pick<TimedRecord, "t">[]>;
};

/** Time since the newest record was sent, alarmed beyond 30 seconds either way. */
export function TransmissionDelayReadout({
  clock,
  store,
}: TransmissionDelayReadoutProps): VNode {
  // The clock draws the delay again each second; the delay reads the time to the
  // millisecond, so the alarm is on from the first millisecond past ALARM_MS.
  useStore(clock);
  const [latest] = useStore(store);

  if (latest === undefined) {
    return <span className="time-alarm">-</span>;
  }
  const delay = transmissionDelay(latest.t, Date.now());

  return (
    <span className={Math.abs(delay) > ALARM_MS ? "time-alarm" : ""}>
      {formatDuration(delay)}
    </span>
  );
}
