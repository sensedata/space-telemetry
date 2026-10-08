import type {Signal} from "../signals/signal.ts";
import type {TimedRecord} from "../timed-record.ts";
import {timedRecord} from "./records.ts";

// Sets `store` to each of `values` as a record of its own after those before it, a second
// after the one before and the first at `start`.
export function sendEachSecond(
  store: Signal<readonly TimedRecord[]>,
  start: number,
  values: readonly number[],
): void {
  for (const [n, v] of values.entries()) {
    store.set([...store.get(), timedRecord({t: start + n, v})]);
  }
}
