import type {Writable} from "node:stream";

import {formatEvent} from "../contract/stream-event.ts";

// Fly's proxy closes a connection that stays idle too long, and the page reopens a stream
// that stays silent for two of these intervals.
const PING_MS = 15_000;
const PING = formatEvent({name: "ping", data: {}});

type Stream = {
  readonly res: Writable;
  sent: number;
  waiting: boolean;
};

export type EventFanout = {
  // Sends `res` the text `initial`, then the events appended from now on, and a ping every
  // PING_MS while it is not waiting for 'drain'.
  readonly add: (res: Writable, initial: string) => void;
  // Appends `event`, formatted by formatEvent.
  readonly append: (event: string) => void;
  // The number of open responses.
  readonly size: number;
};

/**
 * Sends events to open responses from one ring of the last `capacity` events. Each
 * response pulls forward from the sequence number it last sent, and stops while res.write
 * asks it to wait for 'drain', so a client that stops reading holds at most its backfill
 * or one event in the server. A response that falls behind the ring's oldest event is
 * destroyed; the client reconnects and backfills.
 */
export function createEventFanout(capacity: number): EventFanout {
  const ring: string[] = [];
  let newest = 0;
  const streams = new Set<Stream>();

  function write(stream: Stream, text: string) {
    if (stream.res.write(text)) {
      return;
    }

    stream.waiting = true;
    stream.res.once("drain", () => {
      stream.waiting = false;
      nudge(stream);
    });
  }

  function nudge(stream: Stream) {
    if (stream.sent < newest - ring.length) {
      stream.res.destroy();
      return;
    }
    const unsent = ring.slice(ring.length - (newest - stream.sent));
    for (const event of unsent) {
      if (stream.waiting) {
        return;
      }
      stream.sent += 1;
      write(stream, event);
    }
  }

  function add(res: Writable, initial: string): void {
    const stream = {res, sent: newest, waiting: false};
    streams.add(stream);
    const ping = setInterval(() => {
      if (!stream.waiting) {
        write(stream, PING);
      }
    }, PING_MS);
    res.on("close", () => {
      clearInterval(ping);
      streams.delete(stream);
    });
    write(stream, initial);
  }

  function append(event: string): void {
    ring.push(event);
    if (ring.length > capacity) {
      ring.shift();
    }
    newest += 1;
    streams.forEach(nudge);
  }

  return {
    add,
    append,
    get size() {
      return streams.size;
    },
  };
}
