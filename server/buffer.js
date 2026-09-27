'use strict';

const dd = require('./data_dictionary');

const CAPACITY = 150;

function newestFirst(a, b) {
  return b.t - a.t || b.s - a.s;
}

function isSame(a, b) {
  const sameValue = a.v === b.v || (Number.isNaN(a.v) && Number.isNaN(b.v));
  return sameValue && a.t === b.t && a.s === b.s;
}

function isRecord(record) {
  return typeof record === 'object' && record !== null &&
    typeof record.t === 'number' && typeof record.s === 'number';
}

function snapshotDefect(snapshot, channelCount) {
  if (typeof snapshot !== 'object' || snapshot === null || Array.isArray(snapshot)) {
    return 'not an object of channels';
  }
  for (const [channel, records] of Object.entries(snapshot)) {
    // rings takes only the canonical form of an index: '020' finds nothing.
    if (!/^(0|[1-9]\d*)$/.test(channel) || Number(channel) >= channelCount) {
      return 'unknown channel ' + channel;
    }
    if (!Array.isArray(records) || !records.every(isRecord)) {
      return 'malformed records on channel ' + channel;
    }
  }
  return undefined;
}

module.exports = function createBuffer() {
  let rings = Array.from(dd.list, () => []);

  function addTo(ring, record) {
    // Lightstreamer resends an item's current value on resubscribe.
    if (ring.some(held => isSame(held, record))) {
      return;
    }
    ring.push(record);
    if (ring.length > CAPACITY) {
      ring.shift();
    }
  }

  function add(record) {
    addTo(rings[record.k], record);
  }

  function snapshot() {
    return Object.fromEntries(rings.map((ring, k) => [k, ring.slice()]).filter(([, ring]) => ring.length > 0));
  }

  function restore(saved) {
    const defect = snapshotDefect(saved, rings.length);
    if (defect) {
      console.error('buffer snapshot rejected:', defect);
      return;
    }
    rings = Array.from(dd.list, () => []);
    Object.entries(saved).forEach(([k, records]) => records.forEach(r => addTo(rings[k], r)));
    const count = rings.reduce((sum, ring) => sum + ring.length, 0);
    console.log('buffer restored: %d records on %d channels', count, Object.keys(saved).length);
  }

  /**
   * Answers a client's subscription: the newest `count` records of the last `intervalAgo`
   * seconds, ascending by time; the single latest record when that finds nothing or when
   * `count` is below 1, as the client's -1 for the latest is; and, when `intervalAgo` is
   * missing or below 1, the newest `count` records of any age.
   */
  function query(k, intervalAgo, count) {
    // sort is stable, so reversing first puts the later-added of equal records first.
    const newest = rings[k].slice().reverse().sort(newestFirst);
    if (!(count >= 1)) {
      return newest.slice(0, 1);
    }
    const since = intervalAgo >= 1 ? (Date.now() / 1000 | 0) - intervalAgo : -Infinity;
    const found = newest.filter(r => r.t >= since).slice(0, count);
    return found.length > 0 ? found.reverse() : newest.slice(0, 1);
  }

  function mean(k) {
    const values = rings[k].map(r => r.v).filter(Number.isFinite);
    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
  }

  return {add, query, mean, snapshot, restore};
};
