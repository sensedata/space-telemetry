'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const dd = require('./data_dictionary');

const STATUS = dd.hash.STATUS;
const SEED = path.join(__dirname, 'seed', 'buffer.json.gz');

// setTimeout runs a longer delay after 1 ms instead.
const LONGEST_DELAY_MS = 2 ** 31 - 1;

// JSON writes NaN as null. Only v, t and s can be NaN; cv is text.
function reviveNaN(key, value) {
  return value === null && ['v', 't', 's'].includes(key) ? NaN : value;
}

/**
 * Replaces the buffer's records with those saved in `file`, and returns whether the file
 * exists. When the file is missing, logs one line, and when it is not JSON, reports one
 * error; either way the buffer is left as it is. Throws any other read error.
 */
function load(buffer, file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
    console.log('no buffer snapshot at ' + file);
    return false;
  }
  let snapshot;
  try {
    snapshot = JSON.parse(text, reviveNaN);
  } catch (err) {
    console.error('buffer snapshot rejected:', file + ':', err.message);
    return true;
  }
  buffer.restore(snapshot);
  return true;
}

// STATUS describes the feed of the process that saved it; the server reports it afresh at
// boot.
function serialise(buffer) {
  const {[STATUS]: status, ...snapshot} = buffer.snapshot();
  return JSON.stringify(snapshot);
}

async function save(buffer, file) {
  // A kill mid-write leaves the previous snapshot.
  const temporary = file + '.tmp';
  await fs.promises.writeFile(temporary, serialise(buffer));
  await fs.promises.rename(temporary, file);
}

// Not save's temporary file: a periodic save may still be writing that when a signal arrives.
function saveSync(buffer, file) {
  const temporary = file + '.exit.tmp';
  fs.writeFileSync(temporary, serialise(buffer));
  fs.renameSync(temporary, file);
}

/**
 * Loads the buffer from `dataDir`/buffer.json, or when that is missing, from `seedFile`, a
 * gzipped snapshot, logging one line. Then saves it to buffer.json `seconds` after each save
 * ends, logging a failed save, and on SIGINT or SIGTERM, after which the process exits with
 * 128 plus the signal's number. Throws a RangeError unless `seconds` is above 0 and at most
 * 2147483.647.
 */
function keep(buffer, dataDir, seconds, seedFile = SEED) {
  const delay = seconds * 1000;
  if (!(delay > 0 && delay <= LONGEST_DELAY_MS)) {
    throw new RangeError('SNAPSHOT_SECONDS must be above 0 and at most 2147483.647: ' + seconds);
  }
  const file = path.join(dataDir, 'buffer.json');
  if (!load(buffer, file)) {
    console.log('restoring the buffer seed ' + seedFile);
    buffer.restore(JSON.parse(zlib.gunzipSync(fs.readFileSync(seedFile)).toString(), reviveNaN));
  }
  // Scheduled only once the last save ends: saves share one temporary file.
  const saveLater = () => setTimeout(() => {
    save(buffer, file)
      .catch(err => console.error('buffer snapshot failed:', err))
      .then(saveLater);
  }, delay);
  saveLater();
  ['SIGINT', 'SIGTERM'].forEach(signal => process.once(signal, () => {
    saveSync(buffer, file);
    process.exit(128 + os.constants.signals[signal]);
  }));
}

module.exports = {load, save, keep};
