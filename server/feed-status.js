'use strict';

const dd = require('./data_dictionary');
const source = require('./source');

const ISS_CODE_GOOD_DATA = 24;
const ISS_CODE_STALE_DATA = 2;

const STATUS = dd.hash.STATUS;
const TIME_000001 = dd.hash.TIME_000001;

let lastStatusClass;
let silenceTimeout;

function report(connected) {
  const now = Date.now() / 1000 | 0;
  const record = {
    t: now,
    sid: now,
    k: String(STATUS),
    s: connected ? ISS_CODE_GOOD_DATA : ISS_CODE_STALE_DATA,
    v: connected ? 1 : 0
  };
  if (record.s !== lastStatusClass) {
    lastStatusClass = record.s;
    console.log(record);
    source.emit('data', record);
  }
}

// Reports the feed disconnected unless a TIME_000001 record arrives within `ms`.
function expectTimeWithin(ms) {
  clearTimeout(silenceTimeout);
  silenceTimeout = setTimeout(() => report(false), ms);
}

source.on('data', record => {
  if (record.k === TIME_000001) {
    report(true);
    expectTimeWithin(10000);
  }
});

exports.expectTimeWithin = expectTimeWithin;
exports.reportDisconnected = () => report(false);
