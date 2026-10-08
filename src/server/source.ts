import {EventEmitter} from "node:events";

import type {FeedRecord} from "./feed-record.ts";
import {newSessionId} from "./session-id.ts";

const ISS_CODE_GOOD_DATA = 24;
const ISS_CODE_STALE_DATA = 2;

export type Source = Pick<EventEmitter<{data: [FeedRecord]}>, "emit" | "on"> & {
  // Reports the feed disconnected in `ms` unless the source emits a TIME_000001 record
  // first.
  readonly expectTimeWithin: (ms: number) => void;
  // Emits a STATUS record of stale data unless the last one emitted already said so.
  readonly reportDisconnected: () => void;
};

/**
 * Creates a stream of telemetry records into a server. A producer (the Lightstreamer
 * adapter or the replayer) emits 'data' with a record; a consumer never knows which
 * producer is running. The source adds the feed's STATUS: a record of good data on a
 * TIME_000001 record, and of stale data 10 seconds after the last, each unless the last
 * one emitted already said so. A listener gets each STATUS record before the TIME_000001
 * record that moved it.
 */
export function createSource(): Source {
  // eslint-disable-next-line unicorn/prefer-event-target -- a Node EventEmitter hands each listener the record itself, where EventTarget would wrap it in an Event
  const records = new EventEmitter<{data: [FeedRecord]}>();
  const state: {lastStatusClass?: number; silenceTimeout?: NodeJS.Timeout} = {};

  function report(connected: boolean) {
    const record = {
      t: Math.trunc(Date.now() / 1000),
      sid: newSessionId(),
      k: "STATUS",
      s: connected ? ISS_CODE_GOOD_DATA : ISS_CODE_STALE_DATA,
      v: connected ? 1 : 0,
    };
    if (record.s === state.lastStatusClass) {
      return;
    }

    state.lastStatusClass = record.s;
    console.log(record);
    records.emit("data", record);
  }

  function expectTimeWithin(ms: number): void {
    clearTimeout(state.silenceTimeout);
    state.silenceTimeout = setTimeout(() => {
      report(false);
    }, ms);
  }

  function reportDisconnected(): void {
    report(false);
  }

  // The first listener of `records`, so every other gets the STATUS record this one emits
  // before the TIME_000001 record it is handling.
  records.on("data", (record) => {
    if (record.k !== "TIME_000001") {
      return;
    }

    report(true);
    expectTimeWithin(10_000);
  });

  return Object.assign(records, {expectTimeWithin, reportDisconnected});
}
