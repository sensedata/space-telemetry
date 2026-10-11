import type {Writable} from "node:stream";
import zlib from "node:zlib";

import {formatEvent} from "../contract/stream-event.ts";
import {deflateSegment} from "./deflate-segment.ts";

// Fly's proxy closes a connection that stays idle too long, and the page reopens a stream
// that stays silent for two of these intervals.
const PING_MS = 15_000;
const PING = formatEvent({name: "ping", data: {}});
const PING_SEGMENT = deflateSegment(PING);

// Readouts change at most once a second, and a chunk per record would send a gzip response
// over three times the bytes.
const CHUNK_MS = 1000;

type Chunk = {
  readonly text: string;
  readonly plain: Buffer;
  readonly linked: Buffer;
};

type Stream = {
  readonly res: Writable;
  readonly gzip: boolean;
  sent: number;
  waiting: boolean;
  // The length of the next chunk's text that `initial` already held.
  skip: number;
  // Whether the last thing written was chunk `sent`, whole.
  linked: boolean;
};

export type EventFanout = {
  // Sends `res` the text `initial`, gzipped when `gzip`, then the events appended from now
  // on, and a ping every PING_MS while it is not waiting for 'drain'. `initial` must hold
  // every event appended before this call.
  readonly add: (res: Writable, initial: string, gzip: boolean) => void;
  // Appends `event`, formatted by formatEvent.
  readonly append: (event: string) => void;
};

/**
 * Sends events to open responses from one ring of the last `capacity` chunks, each the
 * events appended within CHUNK_MS of its first and deflated once for every gzip response.
 * Each response pulls forward from the sequence number it last sent, and stops while
 * res.write asks it to wait for 'drain', so a client that stops reading holds at most its
 * backfill or one chunk in the server. A response that falls behind the ring's oldest chunk
 * is destroyed; the client reconnects and backfills.
 */
export function createEventFanout(capacity: number): EventFanout {
  const ring: Chunk[] = [];
  let newest = 0;
  let pending = "";
  const streams = new Set<Stream>();

  function write(stream: Stream, data: string | Buffer) {
    if (stream.res.write(data)) {
      return;
    }

    stream.waiting = true;
    stream.res.once("drain", () => {
      stream.waiting = false;
      nudge(stream);
    });
  }

  function encoded(stream: Stream, chunk: Chunk) {
    const text = chunk.text.slice(stream.skip);
    if (!stream.gzip) {
      return text;
    }

    if (stream.skip > 0) {
      return deflateSegment(text);
    }

    return stream.linked ? chunk.linked : chunk.plain;
  }

  function nudge(stream: Stream) {
    if (stream.sent < newest - ring.length) {
      stream.res.destroy();
      return;
    }
    const unsent = ring.slice(ring.length - (newest - stream.sent));
    for (const chunk of unsent) {
      if (stream.waiting) {
        return;
      }
      stream.sent += 1;
      const data = encoded(stream, chunk);
      stream.linked = stream.skip === 0;
      stream.skip = 0;
      write(stream, data);
    }
  }

  function cut() {
    ring.push({
      text: pending,
      plain: deflateSegment(pending),
      linked: deflateSegment(pending, ring.at(-1)?.text),
    });
    pending = "";
    if (ring.length > capacity) {
      ring.shift();
    }
    newest += 1;
    streams.forEach(nudge);
  }

  function add(res: Writable, initial: string, gzip: boolean): void {
    const stream = {
      res,
      gzip,
      sent: newest,
      waiting: false,
      skip: pending.length,
      linked: false,
    };
    streams.add(stream);
    const ping = setInterval(() => {
      if (stream.waiting) {
        return;
      }

      stream.linked = false;
      write(stream, gzip ? PING_SEGMENT : PING);
    }, PING_MS);
    res.on("close", () => {
      clearInterval(ping);
      streams.delete(stream);
    });
    // A sync flush in place of the trailer leaves the gzip member open to the segments
    // that follow.
    write(
      stream,
      gzip ? zlib.gzipSync(initial, {finishFlush: zlib.constants.Z_SYNC_FLUSH}) : initial,
    );
  }

  function append(event: string): void {
    if (pending === "") {
      setTimeout(cut, CHUNK_MS);
    }
    pending += event;
  }

  return {add, append};
}
