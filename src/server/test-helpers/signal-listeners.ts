import {test as fakeClockTest} from "./fake-clock.ts";

const signals = ["SIGINT", "SIGTERM"] as const;

// Every test of this `test` leaves the process's SIGINT and SIGTERM listeners as it found
// them: persist.keep adds one of each. The fake clock of fake-clock.ts runs under every test.
export const test = fakeClockTest.extend(
  "signalListeners",
  {auto: true},
  ({}, {onCleanup}) => {
    const before = signals.map((signal) => [signal, process.listeners(signal)] as const);
    onCleanup(() => {
      for (const [signal, listeners] of before) {
        const added = process
          .listeners(signal)
          .filter((listener) => !listeners.includes(listener));
        for (const listener of added) process.removeListener(signal, listener);
      }
    });
  },
);
