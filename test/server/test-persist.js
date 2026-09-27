'use strict';

const {EventEmitter, once} = require('events');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {expect} = require('chai');
const {mock} = require('node:test');

const serverDir = path.join(__dirname, '..', '..', 'server');
const createBuffer = require(path.join(serverDir, 'buffer'));
const persist = require(path.join(serverDir, 'persist'));

const NOW = 1789211900;

describe('persist', () => {
  let dir;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'persist-'));
    mock.timers.enable({apis: ['Date', 'setTimeout', 'setInterval'], now: NOW * 1000});
  });

  afterEach(() => {
    mock.timers.reset();
    mock.restoreAll();
    fs.rmSync(dir, {recursive: true, force: true});
  });

  describe('save and load', () => {
    it('writes the buffer to the file as JSON keyed by channel', async () => {
      const buffer = createBuffer();
      buffer.add({k: 237, v: 23.26, cv: '23.26', t: NOW - 7, s: 24, sid: 1789211888321});
      const file = path.join(dir, 'buffer.json');

      await persist.save(buffer, file);

      expect(JSON.parse(fs.readFileSync(file, 'utf8'))).to.deep.equal(
        {237: [{k: 237, v: 23.26, cv: '23.26', t: NOW - 7, s: 24, sid: 1789211888321}]});
    });

    it('replaces the file rather than writing into it', async () => {
      const file = path.join(dir, 'buffer.json');
      fs.writeFileSync(file, '{}');
      const replaced = fs.statSync(file).ino;

      await persist.save(createBuffer(), file);

      expect(fs.statSync(file).ino).to.not.equal(replaced);
    });

    it('leaves STATUS out of the file', async () => {
      const buffer = createBuffer();
      buffer.add({k: '297', v: 1, t: NOW - 5, s: 24, sid: NOW - 5});
      buffer.add({k: 20, v: 1, t: NOW - 5, s: 24});
      const file = path.join(dir, 'buffer.json');

      await persist.save(buffer, file);

      expect(Object.keys(JSON.parse(fs.readFileSync(file, 'utf8')))).to.deep.equal(['20']);
    });

    it('loads into a fresh buffer the records it saved', async () => {
      const saved = createBuffer();
      saved.add({k: 20, v: 1, t: NOW - 20, s: 24});
      saved.add({k: 20, v: 2, t: NOW - 10, s: 24});
      const file = path.join(dir, 'buffer.json');
      await persist.save(saved, file);
      const loaded = createBuffer();

      const log = mock.method(console, 'log', () => {});
      persist.load(loaded, file);
      log.mock.restore();

      expect(loaded.query(20, 450, 150).map(r => [r.v, r.t])).to.deep.equal(
        [[1, NOW - 20], [2, NOW - 10]]);
    });

    [
      ['value', {k: 20, v: NaN, cv: null, t: NOW - 10, s: 24, sid: 1789211888321}],
      ['time', {k: 20, v: 1, cv: '1', t: NaN, s: 24, sid: 1789211888321}],
      ['status class', {k: 20, v: 1, cv: '1', t: NOW - 10, s: NaN, sid: 1789211888321}]
    ].forEach(([field, record]) => {
      it(`loads a record whose ${field} is not a number as it was saved`, async () => {
        const saved = createBuffer();
        saved.add(record);
        const file = path.join(dir, 'buffer.json');
        await persist.save(saved, file);
        const loaded = createBuffer();

        const log = mock.method(console, 'log', () => {});
        persist.load(loaded, file);
        log.mock.restore();

        expect(loaded.query(20, 0, -1)).to.deep.equal([record]);
      });
    });

    it('leaves the buffer empty and logs one line when there is no file', () => {
      const buffer = createBuffer();

      const log = mock.method(console, 'log', () => {});
      persist.load(buffer, path.join(dir, 'buffer.json'));
      log.mock.restore();

      expect([buffer.query(20, 450, 150), log.mock.callCount()]).to.deep.equal([[], 1]);
    });

    it('leaves the buffer empty and reports one error when the file is truncated', () => {
      const file = path.join(dir, 'buffer.json');
      fs.writeFileSync(file, '{"20": [{"k": 20, "v": 1, "t": 1789211890, "s"');
      const buffer = createBuffer();

      const error = mock.method(console, 'error', () => {});
      persist.load(buffer, file);
      error.mock.restore();

      expect([buffer.query(20, 450, 150), error.mock.callCount()]).to.deep.equal([[], 1]);
    });

    it('throws when the file exists but cannot be read', () => {
      const file = path.join(dir, 'buffer.json');
      fs.mkdirSync(file);

      expect(() => persist.load(createBuffer(), file)).to.throw(Error).with.property('code', 'EISDIR');
    });
  });

  describe('keep', () => {
    let signalListeners;

    beforeEach(() => {
      signalListeners = ['SIGINT', 'SIGTERM'].map(signal => [signal, process.listeners(signal)]);
    });

    // An existing snapshot keeps keep() from restoring the committed seed.
    function withEmptySnapshot() {
      fs.writeFileSync(path.join(dir, 'buffer.json'), '{}');
    }

    afterEach(() => {
      signalListeners.forEach(([signal, before]) => process.listeners(signal)
        .filter(listener => !before.includes(listener))
        .forEach(listener => process.removeListener(signal, listener)));
    });

    [
      ['not a number', NaN],
      ['beyond the longest timer delay', 2147484]
    ].forEach(([id, seconds]) => {
      it(`rejects a period that is ${id}`, () => {
        const log = mock.method(console, 'log', () => {});
        expect(() => persist.keep(createBuffer(), dir, seconds)).to.throw(RangeError);
        log.mock.restore();
      });
    });

    it('restores the committed seed of 297 channels into a data directory with no snapshot', () => {
      const buffer = createBuffer();

      const log = mock.method(console, 'log', () => {});
      persist.keep(buffer, dir, 1);
      log.mock.restore();

      expect(Object.keys(buffer.snapshot())).to.have.lengthOf(297);
    });

    it('starts no periodic save while the last is still writing', () => {
      withEmptySnapshot();
      const writes = mock.method(fs.promises, 'writeFile', () => new Promise(() => {}));
      const log = mock.method(console, 'log', () => {});
      persist.keep(createBuffer(), dir, 1);
      log.mock.restore();

      mock.timers.tick(1000);
      mock.timers.tick(1000);

      expect(writes.mock.callCount()).to.equal(1);
    });

    it('logs a failed periodic save', async () => {
      withEmptySnapshot();
      const failure = new Error('EIO: i/o error, write');
      mock.method(fs.promises, 'writeFile', async () => {
        throw failure;
      });
      const errors = new EventEmitter();
      mock.method(console, 'error', (...line) => errors.emit('line', line));
      const log = mock.method(console, 'log', () => {});
      persist.keep(createBuffer(), dir, 1);
      log.mock.restore();

      mock.timers.tick(1000);
      const [line] = await once(errors, 'line');

      expect(line).to.deep.equal(['buffer snapshot failed:', failure]);
    });

    it('saves again a period after a failed save', async () => {
      withEmptySnapshot();
      const writes = mock.method(fs.promises, 'writeFile', async () => {
        throw new Error('EIO: i/o error, write');
      });
      const errors = new EventEmitter();
      mock.method(console, 'error', (...line) => errors.emit('line', line));
      const log = mock.method(console, 'log', () => {});
      persist.keep(createBuffer(), dir, 1);
      log.mock.restore();

      mock.timers.tick(1000);
      await once(errors, 'line');
      // The failed save schedules the next only after it has logged.
      await new Promise(resolve => setImmediate(resolve));
      mock.timers.tick(1000);

      expect(writes.mock.callCount()).to.equal(2);
    });
  });
});
