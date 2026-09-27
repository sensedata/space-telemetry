// Plays a recording of source records into the source in place of the live feed.
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const {parseArgs} = require('util');

const dd = require('./data_dictionary');
const source = require('./source');

const USAGE = 'usage: SOURCE=replay node server/server.js [--file PATH] [--rate N] [--rebase]';
const RECORDING = path.join(__dirname, '..', 'harness', 'recordings', '1789211888321.jsonl.gz');

function parseOptions(args) {
  let values;
  try {
    ({values} = parseArgs({args, options: {
      file: {type: 'string', default: RECORDING},
      rate: {type: 'string', default: '1'},
      rebase: {type: 'boolean', default: false}
    }}));
  } catch (error) {
    throw new TypeError(USAGE, {cause: error});
  }
  const rate = Number(values.rate);
  if (!(rate > 0)) {
    throw new RangeError('--rate must be a positive number: ' + values.rate);
  }
  return {...values, rate};
}

/**
 * Emits `rows` (source records ordered by t) into `emitter`, spaced as recorded divided by
 * `rate`, except STATUS rows: feed-status alone derives STATUS. With `rebase`, each record's
 * `t` is the wall-clock second it falls due. Resolves after the last row.
 */
function play(rows, {rate, rebase}, emitter) {
  const telemetry = rows.filter(row => row.k !== dd.hash.STATUS);
  const startMs = Date.now();
  const dueMs = row => startMs + (row.t - telemetry[0].t) * 1000 / rate;

  return new Promise(resolve => {
    let next = 0;
    (function emitDue() {
      const nowMs = Date.now();
      for (; next < telemetry.length && dueMs(telemetry[next]) <= nowMs; next++) {
        const row = telemetry[next];
        emitter.emit('data', rebase ? {...row, t: Math.floor(dueMs(row) / 1000)} : row);
      }
      if (next === telemetry.length) {
        resolve();
      } else {
        setTimeout(emitDue, dueMs(telemetry[next]) - nowMs);
      }
    })();
  });
}

exports.play = play;

/**
 * Plays the gzipped JSONL recording the command-line `args` name into the source. Rejects
 * with TypeError carrying the usage text on bad arguments, RangeError on a bad --rate.
 */
async function start(args) {
  const options = parseOptions(args);
  const rows = zlib.gunzipSync(fs.readFileSync(options.file)).toString().trimEnd().split('\n')
    .map(line => JSON.parse(line));

  console.log('replaying %d records at rate %d%s', rows.length, options.rate,
    options.rebase ? ', rebased to now' : '');
  await play(rows, options, source);
  console.log('replay finished');
}

exports.start = start;
