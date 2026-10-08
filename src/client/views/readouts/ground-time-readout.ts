import type {Readable} from "../../signals/readable.ts";
import type {View} from "../mount.ts";
import {formatUtcTime} from "./format-utc-time.ts";
import {span} from "./span.ts";

export function groundTimeReadout(clock: Readable<number>): View {
  return {
    sources: [clock],
    draw: () => span(formatUtcTime(clock.get())),
  };
}
