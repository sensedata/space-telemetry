import {newestRecord} from "../../records/newest-record.ts";
import type {Reading} from "../../timed-record.ts";
import type {Readable} from "../../signals/readable.ts";
import type {View} from "../mount.ts";
import {formatDuration} from "./format-duration.ts";
import {span} from "./span.ts";

const ALARM_SECONDS = 30;

type TransmissionDelayReadoutProps = {
  clock: Readable<number>;
  store: Readable<readonly Reading[]>;
};

/** Time since the newest record was sent, alarmed beyond ALARM_SECONDS either way. */
export function transmissionDelayReadout({
  clock,
  store,
}: TransmissionDelayReadoutProps): View {
  return {
    sources: [clock, store],
    draw() {
      const latest = newestRecord(store.get());
      if (latest === undefined) {
        return span("-", {class: "time-alarm"});
      }

      // Negative when the record's time is after the clock's.
      const delaySeconds = clock.get() - latest.t;
      return span(formatDuration(delaySeconds * 1000), {
        class: Math.abs(delaySeconds) > ALARM_SECONDS ? "time-alarm" : "",
      });
    },
  };
}
