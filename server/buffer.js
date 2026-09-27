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

/**
 * Holds the most recent 150 records of each telemetry channel, as the source emits them.
 *
 * query(k, intervalAgo, count) answers a client's subscription: the newest `count` records
 * of the last `intervalAgo` seconds, ascending by time; the single latest record when that
 * finds nothing or when `count` is below 1, as -1 is; and, when `intervalAgo` is missing or
 * below 1, the newest `count` records of any age.
 */
module.exports = function createBuffer() {
  const rings = Array.from(dd.list, () => []);

  function add(record) {
    const ring = rings[record.k];
    // A record the same in v, t and s as one held is Lightstreamer's repeat of an item's
    // current value on resubscribe.
    if (ring.some(held => isSame(held, record))) {
      return;
    }
    ring.push(record);
    if (ring.length > CAPACITY) {
      ring.shift();
    }
  }

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

  return {add, query, mean};
};
