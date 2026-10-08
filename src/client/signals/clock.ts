import type {Readable} from "./readable.ts";
import {signal} from "./signal.ts";

// Floored as the feed's record times are, so the charts' per-second windows line up with
// the records. In this file: startClock is its only caller.
function unixNow(): number {
  return Math.floor(Date.now() / 1000);
}

/** The current Unix second, set each second by a timer that runs for the page's life. */
export function startClock(): Readable<number> {
  const second = signal(unixNow());
  setInterval(() => {
    second.set(unixNow());
  }, 1000);
  return second;
}
