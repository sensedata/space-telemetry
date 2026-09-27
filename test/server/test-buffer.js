'use strict';

const path = require('path');
const {expect} = require('chai');
const {mock} = require('node:test');

const createBuffer = require(path.join(__dirname, '..', '..', 'server', 'buffer'));
const {groups} = require('./fixtures/contract-rows.json');

const NOW = 1789211900;

const captured = Object.fromEntries(groups.map(({rows}) => [rows[0].item, rows]));

// A captured row as the Lightstreamer adapter emits it, at `t` or else its recorded second.
function record(row, t = Date.parse(row.ts) / 1000) {
  return {
    k: row.idx, v: Number(row.value), cv: row.value_calibrated, t, s: row.status, sid: row.session_id
  };
}

function times(records) {
  return records.map(r => r.t);
}

describe('buffer', () => {
  beforeEach(() => {
    mock.timers.enable({apis: ['Date'], now: NOW * 1000});
  });

  afterEach(() => {
    mock.timers.reset();
  });

  describe('query', () => {
    it('returns the records in the window in ascending time order', () => {
      const [first, second, third] = captured.USLAB000059;
      const buffer = createBuffer();
      buffer.add(record(third, NOW - 10));
      buffer.add(record(first, NOW - 100));
      buffer.add(record(second, NOW - 50));

      expect(times(buffer.query(237, 450, 150))).to.deep.equal([NOW - 100, NOW - 50, NOW - 10]);
    });

    it('leaves out records older than intervalAgo seconds', () => {
      const [first, second, third] = captured.USLAB000059;
      const buffer = createBuffer();
      buffer.add(record(first, NOW - 451));
      buffer.add(record(second, NOW - 450));
      buffer.add(record(third, NOW - 400));

      expect(times(buffer.query(237, 450, 150))).to.deep.equal([NOW - 450, NOW - 400]);
    });

    it('returns at most count records, the latest ones', () => {
      const [first, second, third] = captured.USLAB000059;
      const buffer = createBuffer();
      buffer.add(record(first, NOW - 30));
      buffer.add(record(second, NOW - 20));
      buffer.add(record(third, NOW - 10));

      expect(times(buffer.query(237, 450, 2))).to.deep.equal([NOW - 20, NOW - 10]);
    });

    it('returns the single latest record when the window is empty', () => {
      const [first, second] = captured.USLAB000020;
      const buffer = createBuffer();
      buffer.add(record(second, NOW - 900));
      buffer.add(record(first, NOW - 1000));

      expect(buffer.query(198, 450, 150).map(r => [r.t, r.v])).to.deep.equal(
        [[NOW - 900, -0.09021296352148056]]);
    });

    it('returns the single latest record when count is -1', () => {
      const [first, second, third] = captured.USLAB000020;
      const buffer = createBuffer();
      buffer.add(record(first, NOW - 30));
      buffer.add(record(second, NOW - 20));
      buffer.add(record(third, NOW - 10));

      expect(buffer.query(198, 450, -1).map(r => [r.t, r.v])).to.deep.equal(
        [[NOW - 10, -0.09021422266960144]]);
    });

    it('returns the single latest record when count is below 1', () => {
      const [first, second] = captured.USLAB000020;
      const buffer = createBuffer();
      buffer.add(record(first, NOW - 20));
      buffer.add(record(second, NOW - 10));

      expect(buffer.query(198, 450, 0).map(r => [r.t, r.v])).to.deep.equal(
        [[NOW - 10, -0.09021296352148056]]);
    });

    it('returns the latest count records of any age when intervalAgo is missing', () => {
      const [first, second, third] = captured.USLAB000059;
      const buffer = createBuffer();
      buffer.add(record(first, NOW - 3000));
      buffer.add(record(second, NOW - 2000));
      buffer.add(record(third, NOW - 1000));

      expect(times(buffer.query(237, null, 2))).to.deep.equal([NOW - 2000, NOW - 1000]);
    });

    it('prefers the higher status class between records of the same second', () => {
      const [, original, resend] = captured.NODE3000009;
      const buffer = createBuffer();
      buffer.add(record(original));
      buffer.add(record(resend));

      expect(buffer.query(75, 450, -1).map(r => [r.v, r.s])).to.deep.equal([[87.87999725341797, 24]]);
    });

    it('keeps the order records were added in between records of the same second', () => {
      const buffer = createBuffer();
      captured.USLAB000085.forEach(row => buffer.add(record(row)));

      expect(buffer.query(263, 450, 2).map(r => r.v)).to.deep.equal([0.09765625, 0.19921875]);
    });

    it('returns only the records of the channel asked for', () => {
      const buffer = createBuffer();
      buffer.add(record(captured.USLAB000059[0], NOW - 10));
      buffer.add(record(captured.USLAB000043[0], NOW - 5));

      expect(buffer.query(221, 450, 150).map(r => [r.k, r.t])).to.deep.equal([[221, NOW - 5]]);
    });

    it('returns nothing for a channel with no records', () => {
      const buffer = createBuffer();

      expect(buffer.query(20, 450, 150)).to.deep.equal([]);
    });
  });

  describe('add', () => {
    it('keeps the 150 most recently added records of a channel', () => {
      const buffer = createBuffer();
      for (let t = NOW - 151; t < NOW; t++) {
        buffer.add(record(captured.USLAB000059[0], t));
      }

      const kept = buffer.query(237, 450, 1000);

      expect([kept.length, kept[0].t, kept[149].t]).to.deep.equal([150, NOW - 150, NOW - 1]);
    });

    it('ignores a record identical in value, time and status to one it holds', () => {
      const [resent] = captured.NODE3000009;
      const buffer = createBuffer();
      buffer.add(record(resent, NOW - 10));
      buffer.add(record(resent, NOW - 10));

      expect(times(buffer.query(75, 450, 150))).to.deep.equal([NOW - 10]);
    });

    it('keeps records of the same time and status that differ in value', () => {
      const [first, second] = captured.USLAB000085;
      const buffer = createBuffer();
      buffer.add(record(first));
      buffer.add(record(second));

      expect(buffer.query(263, 450, 150).map(r => r.v)).to.have.members([0, 0.09765625]);
    });

    it('keeps records of the same value and time that differ in status', () => {
      const [first, second] = captured.USLAB000086;
      const buffer = createBuffer();
      buffer.add(record(first));
      buffer.add(record(second));

      expect(buffer.query(264, 0, 150).map(r => r.s)).to.have.members([9, 24]);
    });

    it('ignores a repeat of a record whose value is not a number', () => {
      // Estimated: no captured row has a value that is not a number.
      const notANumber = {...record(captured.USLAB000059[0], NOW - 10), v: NaN};
      const buffer = createBuffer();
      buffer.add(notANumber);
      buffer.add(notANumber);

      expect(times(buffer.query(237, 450, 150))).to.deep.equal([NOW - 10]);
    });

    it('ignores a record of value -0 repeating one of value 0', () => {
      const zero = record(captured.USLAB000085[0], NOW - 10);
      const buffer = createBuffer();
      buffer.add(zero);
      // Estimated: no captured row has the value -0.
      buffer.add({...zero, v: -0});

      expect(times(buffer.query(263, 450, 150))).to.deep.equal([NOW - 10]);
    });
  });

  describe('mean', () => {
    it('averages the values the channel holds', () => {
      const buffer = createBuffer();
      captured.USLAB000043.forEach(row => buffer.add(record(row)));
      buffer.add(record(captured.USLAB000059[0]));

      expect(buffer.mean(221)).to.equal(6.25);
    });

    it('leaves out values the channel no longer holds', () => {
      const [first, , , fourth] = captured.USLAB000043;
      const buffer = createBuffer();
      buffer.add(record(first, NOW - 151));
      for (let t = NOW - 150; t < NOW; t++) {
        buffer.add(record(fourth, t));
      }

      expect(buffer.mean(221)).to.equal(5);
    });

    [
      ['not a number', NaN],
      ['infinite', Infinity]
    ].forEach(([id, value]) => {
      it(`leaves out a value that is ${id}`, () => {
        const [first, second, , fourth] = captured.USLAB000043;
        const buffer = createBuffer();
        buffer.add(record(first, NOW - 30));
        // Estimated: no captured row has a value that is not finite.
        buffer.add({...record(second, NOW - 20), v: value});
        buffer.add(record(fourth, NOW - 10));

        expect(buffer.mean(221)).to.equal(7.5);
      });
    });

    it('is 0 when the channel holds no numeric value', () => {
      const buffer = createBuffer();
      // Estimated: no captured row has a value that is not a number.
      buffer.add({...record(captured.USLAB000059[0], NOW - 10), v: NaN});

      expect(buffer.mean(237)).to.equal(0);
    });
  });

  describe('snapshot and restore', () => {
    afterEach(() => {
      mock.restoreAll();
    });

    function throughJson(snapshot) {
      return JSON.parse(JSON.stringify(snapshot));
    }

    it('restores every record of a channel in the order it was added', () => {
      const [first, second, third] = captured.USLAB000085;
      const buffer = createBuffer();
      buffer.add(record(first, NOW - 10));
      buffer.add(record(second, NOW - 10));
      buffer.add(record(third, NOW - 20));
      buffer.add(record(third, NOW - 10));
      const restored = createBuffer();

      const log = mock.method(console, 'log', () => {});
      restored.restore(throughJson(buffer.snapshot()));
      log.mock.restore();

      expect(restored.query(263, 450, 150).map(r => [r.t, r.v])).to.deep.equal([
        [NOW - 20, 0.19921875], [NOW - 10, 0], [NOW - 10, 0.09765625], [NOW - 10, 0.19921875]
      ]);
    });

    it('restores each record with every field it was added with', () => {
      const buffer = createBuffer();
      buffer.add({k: '297', v: 1, t: NOW - 5, s: 24, sid: NOW - 5});
      buffer.add(record(captured.USLAB000086[0]));
      const restored = createBuffer();

      const log = mock.method(console, 'log', () => {});
      restored.restore(throughJson(buffer.snapshot()));
      log.mock.restore();

      expect([restored.query(297, 0, -1), restored.query(264, 0, -1)]).to.deep.equal([
        [{k: '297', v: 1, t: NOW - 5, s: 24, sid: NOW - 5}],
        [{k: 264, v: 53, cv: '', t: 1768262991, s: 9, sid: 1768781287851}]
      ]);
    });

    it('keeps holding its records when a snapshot it returned is changed', () => {
      const [first, second] = captured.USLAB000059;
      const buffer = createBuffer();
      buffer.add(record(first, NOW - 10));

      buffer.snapshot()[237].push(record(second, NOW - 5));

      expect(times(buffer.query(237, 450, 150))).to.deep.equal([NOW - 10]);
    });

    it('replaces the records the buffer held', () => {
      const buffer = createBuffer();
      buffer.add(record(captured.USLAB000043[0], NOW - 10));

      const log = mock.method(console, 'log', () => {});
      buffer.restore({237: [record(captured.USLAB000059[0], NOW - 5)]});
      log.mock.restore();

      expect(buffer.query(221, 450, 150)).to.deep.equal([]);
    });

    it('keeps the last 150 records of a channel restored with more', () => {
      const records = [];
      for (let t = NOW - 200; t < NOW; t++) {
        records.push(record(captured.USLAB000059[0], t));
      }
      const buffer = createBuffer();

      const log = mock.method(console, 'log', () => {});
      buffer.restore({237: records});
      log.mock.restore();

      const kept = buffer.query(237, 450, 1000);
      expect([kept.length, kept[0].t, kept[149].t]).to.deep.equal([150, NOW - 150, NOW - 1]);
    });

    it('holds nothing after restoring an empty snapshot', () => {
      const buffer = createBuffer();
      buffer.add(record(captured.USLAB000059[0], NOW - 10));

      const log = mock.method(console, 'log', () => {});
      buffer.restore({});
      log.mock.restore();

      expect(buffer.query(237, 450, 150)).to.deep.equal([]);
    });

    it('logs one line on restore', () => {
      const buffer = createBuffer();

      const log = mock.method(console, 'log', () => {});
      buffer.restore({237: [record(captured.USLAB000059[0], NOW - 10)]});
      log.mock.restore();

      expect(log.mock.callCount()).to.equal(1);
    });

    [
      ['null', null],
      ['a number', 5],
      ['an array', [[record(captured.USLAB000059[0], NOW - 5)]]],
      ['a string', '{"237": []}'],
      ['a channel that is not an array', {237: {t: NOW - 5}}],
      ['a record that is not an object', {237: [5]}],
      ['a record that is null', {237: [null]}],
      ['a record with no time', {237: [{k: 237, v: 2, s: 24}]}],
      ['a record with no time after a good one',
        {237: [record(captured.USLAB000059[0], NOW - 5), {k: 237, v: 3, s: 24}]}],
      ['a record with a text time', {237: [{k: 237, v: 2, t: String(NOW - 5), s: 24}]}],
      ['a record with no status class', {237: [{k: 237, v: 2, t: NOW - 5}]}],
      ['a channel name that is not a number', {USLAB000059: [record(captured.USLAB000059[0], NOW - 5)]}],
      ['a channel number with a leading zero', {'0237': [record(captured.USLAB000059[0], NOW - 5)]}],
      ['a channel number beyond 297', {298: [record(captured.USLAB000059[0], NOW - 5)]}],
      ['a negative channel number', {'-1': [record(captured.USLAB000059[0], NOW - 5)]}]
    ].forEach(([shape, snapshot]) => {
      it(`keeps what it held and reports one error when the snapshot is ${shape}`, () => {
        const buffer = createBuffer();
        buffer.add(record(captured.USLAB000059[1], NOW - 10));

        const error = mock.method(console, 'error', () => {});
        buffer.restore(snapshot);
        error.mock.restore();

        expect([buffer.query(237, 450, 150).map(r => r.v), error.mock.callCount()])
          .to.deep.equal([[23.32332992553711], 1]);
      });
    });
  });
});
