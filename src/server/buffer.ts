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

// The source's own channel; its class says whether the feed is connected, not what the
// feed made of a value.
const STATUS = channels.numbers.STATUS;

// The buffer stores the carried channels alone, so no client gets a record of another,
// whether it arrives live, replayed, seeded or restored.
const CARRIED = new Set(channels.carried.map((name) => channels.numbers[name]));

// Answers the records of each channel of `snapshot`, or, when it is no snapshot of
// `channelCount` channels, the defect that shows it.
function parseSnapshot(
  snapshot: unknown,
  channelCount: number,
): Map<number, FeedRecord[]> | string {
  if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot)) {
    return "not an object of channels";
  }
  const entries: [string, unknown][] = Object.entries(snapshot);
  const saved = new Map<number, FeedRecord[]>();
  for (const [channel, records] of entries) {
    // A channel's key is only the canonical form of its number: '020' is no channel.
    if (!/^(0|[1-9]\d*)$/.test(channel) || Number(channel) >= channelCount) {
      return "unknown channel " + channel;
    }
    if (!Array.isArray(records) || !records.every(isFeedRecord)) {
      return "malformed records on channel " + channel;
    }
    saved.set(Number(channel), records);
  }
  return saved;
}

export type RecordBuffer = {
  // Stores the record in its channel and answers whether it was stored.
  readonly add: (record: FeedRecord) => boolean;
  readonly backfill: (k: number) => FeedRecord[];
  readonly mean: (k: number) => number;
  readonly snapshot: () => Record<string, FeedRecord[]>;
  // Replaces every channel's records with a snapshot's, or logs why it rejects one.
  readonly restore: (saved: unknown) => void;
};

/**
 * Holds the last CAPACITY records of each carried channel, a resent record once, and none
 * whose status class marks its value as no reading.
 */
export function createBuffer(): RecordBuffer {
  let rings: FeedRecord[][] = Array.from(channels.names, () => []);

  function ringOf(k: number) {
    const ring = rings[k];
    if (ring === undefined) {
      throw new RangeError(`no channel ${k} in the data dictionary`);
    }
    return ring;
  }

  // Answers whether the record was stored in channel `k`.
  function addTo(k: number, record: FeedRecord) {
    const ring = ringOf(k);
    if (!CARRIED.has(k)) {
      return false;
    }
    if (k !== STATUS && !READING_CLASSES.has(record.s)) {
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
    const parsed = parseSnapshot(saved, rings.length);
    if (typeof parsed === "string") {
      console.error("buffer snapshot rejected:", parsed);
      return;
    }
    rings = Array.from(channels.names, () => []);
    parsed.forEach((records, k) => {
      for (const r of records) addTo(k, r);
    });
    const held = rings.filter((ring) => ring.length > 0);
    const count = held.reduce((sum, ring) => sum + ring.length, 0);
    console.log("buffer restored: %d records on %d channels", count, held.length);
  }

  /**
   * Answers a client's backfill of channel `k`, ascending by time: the records of the last
   * BACKFILL_SECONDS, or the single latest when that window finds none.
   */
  function backfill(k: number): FeedRecord[] {
    // sort is stable, so reversing first puts the later-added of equal records first.
    const newest = ringOf(k).toReversed().toSorted(newestFirst);
    const found = newest.filter(
      (r) => r.t >= Math.trunc(Date.now() / 1000) - BACKFILL_SECONDS,
    );
    return found.length > 0 ? found.toReversed() : newest.slice(0, 1);
  }

  function mean(k: number): number {
    const values = ringOf(k)
      .map((r) => r.v)
      .filter((v) => Number.isFinite(v));
    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
  }

  return {add, backfill, mean, snapshot, restore};
}
