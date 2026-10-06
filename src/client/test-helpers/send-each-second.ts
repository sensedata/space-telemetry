import {act} from "preact/test-utils";

import type {Relay} from "../relay.ts";
import {timedRecord} from "./records.ts";

// Sends each of `values` as a record of its own, a second after the one before and the first
// at `start`, letting the views render after each.
export async function sendEachSecond(
  relay: Pick<Relay, "send">,
  start: number,
  values: readonly number[],
): Promise<void> {
  for (const [n, v] of values.entries()) {
    await act(() => {
      relay.send([timedRecord({t: start + n, v})]);
    });
  }
}
