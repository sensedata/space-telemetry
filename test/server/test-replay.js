'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const {EventEmitter} = require('events');
const {expect} = require('chai');
const {mock} = require('node:test');

const {play, start} = require(path.join(__dirname, '..', '..', 'server', 'replay'));
const serverSource = require(path.join(__dirname, '..', '..', 'server', 'source'));

function collect() {
  const source = new EventEmitter();
  const records = [];
  source.on('data', record => records.push(record));
  return {source, records};
}

describe('replay', () => {
  beforeEach(() => {
    mock.timers.enable({apis: ['setTimeout', 'Date']});
  });

  afterEach(() => {
    mock.timers.reset();
  });

  describe('start', () => {
    let dir;
    let records;
    const collectRecord = record => records.push(record);

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'replay-'));
      records = [];
      serverSource.on('data', collectRecord);
      mock.method(console, 'log', () => {});
    });

    afterEach(() => {
      mock.restoreAll();
      serverSource.off('data', collectRecord);
      fs.rmSync(dir, {recursive: true});
    });

    it('replays the gzipped JSONL recording named by --file into the source in order', async () => {
      const recorded = [
        {k: 294, v: 39.72657012939453, cv: '39.73', t: 1789211884, s: 24, sid: 1789211888321},
        {k: 295, v: -26.246341705322266, cv: '-26.25', t: 1789211884, s: 24, sid: 1789211888321},
        {k: 296, v: 1789211884, cv: '255/11:18:04', t: 1789211884, s: 24, sid: 1789211888321}
      ];
      const file = path.join(dir, 'recording.jsonl.gz');
      fs.writeFileSync(file, zlib.gzipSync(recorded.map(row => JSON.stringify(row) + '\n').join('')));

      await start(['--file', file]);

      expect(records).to.deep.equal(recorded);
    });
  });

  it('emits rows at the recorded cadence divided by the rate', () => {
    const {source, records} = collect();
    play([
      {k: 1, v: 1, cv: '1', t: 1000, s: 24, sid: 7},
      {k: 2, v: 2, cv: '2', t: 1001, s: 24, sid: 7},
      {k: 3, v: 3, cv: '3', t: 1003, s: 24, sid: 7}
    ], {rate: 4, rebase: false}, source);

    const emittedAt = [];
    [249, 1, 499, 1].forEach(ms => {
      mock.timers.tick(ms);
      emittedAt.push(records.map(record => record.k));
    });

    expect(emittedAt).to.deep.equal([[1], [1, 2], [1, 2], [1, 2, 3]]);
  });

  it('never emits recorded STATUS rows', () => {
    const {source, records} = collect();

    play([
      {k: 1, v: 1, cv: '1', t: 1000, s: 24, sid: 7},
      {k: 297, v: 0, cv: null, t: 1000, s: 2, sid: 1000},
      {k: 2, v: 2, cv: '2', t: 1000, s: 24, sid: 7}
    ], {rate: 1, rebase: false}, source);

    expect(records.map(record => record.k)).to.deep.equal([1, 2]);
  });

  it('with rebase, stamps each record with the wall-clock second it falls due', () => {
    mock.timers.setTime(Date.parse('2026-09-26T12:00:00.250Z'));
    const {source, records} = collect();
    play([
      {k: 1, v: 1, cv: '1', t: 1000, s: 24, sid: 7},
      {k: 2, v: 2, cv: '2', t: 1020, s: 24, sid: 7}
    ], {rate: 10, rebase: true}, source);

    mock.timers.tick(2000);

    expect(records.map(record => record.t)).to.deep.equal([1790424000, 1790424002]);
  });

  it('resolves only after emitting the last row', async () => {
    const {source, records} = collect();
    const done = play([
      {k: 1, v: 1, cv: '1', t: 1000, s: 24, sid: 7},
      {k: 2, v: 2, cv: '2', t: 1010, s: 24, sid: 7}
    ], {rate: 1, rebase: false}, source);
    const emittedWhenResolved = done.then(() => records.length);

    // Lets a premature resolution run its callback before the clock reaches the last row.
    await null;
    mock.timers.tick(10000);

    expect(await emittedWhenResolved).to.equal(2);
  });
});
