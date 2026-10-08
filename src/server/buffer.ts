import * as channels from "../contract/channels.ts";
import {type FeedRecord, isFeedRecord} from "./feed-record.ts";

const CAPACITY = 150;

// Three times the 150 points a chart holds, which is more than any chart draws at one point
// a second. The surplus more often finds a channel that reports only on change its record in
// force at the chart's left edge, where the chart otherwise starts on a copy of its oldest
// record.
const BACKFILL_SECONDS = 450;

function newestFirst(a: FeedRecord, b: FeedRecord) {
  return b.t - a.t || b.s - a.s;
}

// Not Object.is: a resend of 0 as -0 is the same record.
function isSameNumber(a: number, b: number) {
  return a === b || (Number.isNaN(a) && Number.isNaN(b));
}

function isSame(a: FeedRecord, b: FeedRecord) {
  return isSameNumber(a.v, b.v) && isSameNumber(a.t, b.t) && isSameNumber(a.s, b.s);
}

// The feed's status classes whose Value is a reading: 24 is good data, and 9 is the last
// good reading, resent while the signal is down. Every other class marks a value that is
// missing, dead, or outside what its sensor measures.
const READING_CLASSES = new Set([24, 9]);

// Answers the records of each channel of `snapshot`, or, when it is no snapshot, the
// defect that shows it.
function parseSnapshot(snapshot: unknown): Map<string, FeedRecord[]> | string {
  if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot)) {
    return "not an object of channels";
  }
  const entries: [string, unknown][] = Object.entries(snapshot);
  const saved = new Map<string, FeedRecord[]>();
  for (const [channel, records] of entries) {
    if (!Array.isArray(records) || !records.every(isFeedRecord)) {
      return "malformed records on channel " + channel;
    }
    saved.set(channel, records);
  }
  return saved;
}

function emptyRings() {
  return new Map<string, FeedRecord[]>(channels.names.map((name) => [name, []]));
}

export type RecordBuffer = {
  // Stores the record in its channel and answers whether it was stored.
  readonly add: (record: FeedRecord) => boolean;
  readonly backfill: (k: string) => FeedRecord[];
  readonly mean: (k: string) => number;
  readonly snapshot: () => Record<string, FeedRecord[]>;
  // Replaces every channel's records with a snapshot's, or logs why it rejects one.
  readonly restore: (saved: unknown) => void;
};

/**
 * Holds the last CAPACITY records of each channel of the data dictionary, a resent record
 * once, and none whose status class marks its value as no reading. Throws a RangeError
 * from backfill and mean for a channel outside the dictionary.
 */
export function createBuffer(): RecordBuffer {
  let rings = emptyRings();

  function ringOf(k: string) {
    const ring = rings.get(k);
    if (ring === undefined) {
      throw new RangeError(`no channel ${k} in the data dictionary`);
    }
    return ring;
  }

  // Answers whether the record was stored in channel `k`. The buffer stores the channels
  // of the data dictionary alone, so no client gets a record of another, whether it
  // arrives live, replayed, seeded or restored.
  function addTo(k: string, record: FeedRecord) {
    const ring = rings.get(k);
    if (ring === undefined) {
      return false;
    }
    // STATUS is the source's own channel; its class says whether the feed is connected,
    // not what the feed made of a value.
    if (k !== "STATUS" && !READING_CLASSES.has(record.s)) {
      return false;
    }
    // StreamRecord types s as a number, and JSON would write a NaN class as null. STATUS
    // skips the check above, which keeps one out of every other channel.
    if (Number.isNaN(record.s)) {
      return false;
    }
    // Lightstreamer resends an item's current value on resubscribe.
    if (ring.some((held) => isSame(held, record))) {
      return false;
    }
    ring.push(record);
    if (ring.length > CAPACITY) {
      ring.shift();
    }
    return true;
  }

  function add(record: FeedRecord): boolean {
    return addTo(record.k, record);
  }

  function snapshot(): Record<string, FeedRecord[]> {
    return Object.fromEntries(
      rings
        .entries()
        .filter(([, ring]) => ring.length > 0)
        .map(([k, ring]) => [k, [...ring]]),
    );
  }

  function restore(saved: unknown): void {
    const parsed = parseSnapshot(saved);
    if (typeof parsed === "string") {
      console.error("buffer snapshot rejected:", parsed);
      return;
    }
    rings = emptyRings();
    parsed.forEach((records, k) => {
      for (const r of records) addTo(k, r);
    });
    const held = rings
      .values()
      .filter((ring) => ring.length > 0)
      .toArray();
    const count = held.reduce((sum, ring) => sum + ring.length, 0);
    console.log("buffer restored: %d records on %d channels", count, held.length);
  }

  /**
   * Answers a client's backfill of channel `k`, ascending by time: the records of the last
   * BACKFILL_SECONDS, or the single latest when that window finds none.
   */
  function backfill(k: string): FeedRecord[] {
    // sort is stable, so reversing first puts the later-added of equal records first.
    const newest = ringOf(k).toReversed().toSorted(newestFirst);
    const found = newest.filter(
      (r) => r.t >= Math.trunc(Date.now() / 1000) - BACKFILL_SECONDS,
    );
    return found.length > 0 ? found.toReversed() : newest.slice(0, 1);
  }

  function mean(k: string): number {
    const values = ringOf(k)
      .map((r) => r.v)
      .filter((v) => Number.isFinite(v));
    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
  }

  return {add, backfill, mean, snapshot, restore};
}
