'use strict';

const path = require('path');
const {expect} = require('chai');
const {mock} = require('node:test');

const createBuffer = require(path.join(__dirname, '..', '..', 'server', 'buffer'));

const NOW = 1789211900;

function record(k, t, v, s) {
  return {k, v, cv: String(v), t, s, sid: 1789211888321};
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
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 10, 3, 24));
      buffer.add(record(20, NOW - 100, 1, 24));
      buffer.add(record(20, NOW - 50, 2, 24));

      expect(times(buffer.query(20, 450, 150))).to.deep.equal([NOW - 100, NOW - 50, NOW - 10]);
    });

    it('leaves out records older than intervalAgo seconds', () => {
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 451, 1, 24));
      buffer.add(record(20, NOW - 450, 2, 24));
      buffer.add(record(20, NOW - 400, 3, 24));

      expect(times(buffer.query(20, 450, 150))).to.deep.equal([NOW - 450, NOW - 400]);
    });

    it('returns at most count records, the latest ones', () => {
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 30, 1, 24));
      buffer.add(record(20, NOW - 20, 2, 24));
      buffer.add(record(20, NOW - 10, 3, 24));

      expect(times(buffer.query(20, 450, 2))).to.deep.equal([NOW - 20, NOW - 10]);
    });

    it('returns the single latest record when the window is empty', () => {
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 900, 2, 24));
      buffer.add(record(20, NOW - 1000, 1, 24));

      expect(buffer.query(20, 450, 150).map(r => [r.t, r.v])).to.deep.equal([[NOW - 900, 2]]);
    });

    it('returns the single latest record when count is -1', () => {
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 30, 1, 24));
      buffer.add(record(20, NOW - 20, 2, 24));
      buffer.add(record(20, NOW - 10, 3, 24));

      expect(buffer.query(20, 450, -1).map(r => [r.t, r.v])).to.deep.equal([[NOW - 10, 3]]);
    });

    it('returns the single latest record when count is below 1', () => {
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 20, 1, 24));
      buffer.add(record(20, NOW - 10, 2, 24));

      expect(buffer.query(20, 450, 0).map(r => [r.t, r.v])).to.deep.equal([[NOW - 10, 2]]);
    });

    it('returns the latest count records of any age when intervalAgo is missing', () => {
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 3000, 1, 24));
      buffer.add(record(20, NOW - 2000, 2, 24));
      buffer.add(record(20, NOW - 1000, 3, 24));

      expect(times(buffer.query(20, null, 2))).to.deep.equal([NOW - 2000, NOW - 1000]);
    });

    it('prefers the higher status class between records of the same second', () => {
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 10, 1, 24));
      buffer.add(record(20, NOW - 10, 0, 2));

      expect(buffer.query(20, 450, -1).map(r => [r.v, r.s])).to.deep.equal([[1, 24]]);
    });

    it('keeps the order records were added in between records of the same second', () => {
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 10, 1, 24));
      buffer.add(record(20, NOW - 10, 2, 24));
      buffer.add(record(20, NOW - 10, 3, 24));

      expect(buffer.query(20, 450, 2).map(r => r.v)).to.deep.equal([2, 3]);
    });

    it('returns only the records of the channel asked for', () => {
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 10, 1, 24));
      buffer.add(record(21, NOW - 5, 2, 24));

      expect(buffer.query(21, 450, 150).map(r => [r.k, r.t])).to.deep.equal([[21, NOW - 5]]);
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
        buffer.add(record(20, t, 1, 24));
      }

      const kept = buffer.query(20, 450, 1000);

      expect([kept.length, kept[0].t, kept[149].t]).to.deep.equal([150, NOW - 150, NOW - 1]);
    });

    it('ignores a record identical in value, time and status to one it holds', () => {
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 10, 1, 24));
      buffer.add(record(20, NOW - 10, 1, 24));

      expect(times(buffer.query(20, 450, 150))).to.deep.equal([NOW - 10]);
    });

    it('keeps records of the same time and status that differ in value', () => {
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 10, 1, 24));
      buffer.add(record(20, NOW - 10, 2, 24));

      expect(buffer.query(20, 450, 150).map(r => r.v)).to.have.members([1, 2]);
    });

    it('keeps records of the same value and time that differ in status', () => {
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 10, 1, 24));
      buffer.add(record(20, NOW - 10, 1, 2));

      expect(buffer.query(20, 450, 150).map(r => r.s)).to.have.members([24, 2]);
    });

    it('ignores a repeat of a record whose value is not a number', () => {
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 10, NaN, 24));
      buffer.add(record(20, NOW - 10, NaN, 24));

      expect(times(buffer.query(20, 450, 150))).to.deep.equal([NOW - 10]);
    });

    it('ignores a record of value -0 repeating one of value 0', () => {
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 10, 0, 24));
      buffer.add(record(20, NOW - 10, -0, 24));

      expect(times(buffer.query(20, 450, 150))).to.deep.equal([NOW - 10]);
    });
  });

  describe('mean', () => {
    it('averages the values the channel holds', () => {
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 30, 1.5, 24));
      buffer.add(record(20, NOW - 20, -4, 24));
      buffer.add(record(20, NOW - 10, 7, 24));
      buffer.add(record(21, NOW - 10, 100, 24));

      expect(buffer.mean(20)).to.equal(1.5);
    });

    it('leaves out values the channel no longer holds', () => {
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 151, 1000, 24));
      for (let t = NOW - 150; t < NOW; t++) {
        buffer.add(record(20, t, 2, 24));
      }

      expect(buffer.mean(20)).to.equal(2);
    });

    [
      ['not a number', NaN],
      ['infinite', Infinity]
    ].forEach(([id, value]) => {
      it(`leaves out a value that is ${id}`, () => {
        const buffer = createBuffer();
        buffer.add(record(20, NOW - 30, 2, 24));
        buffer.add(record(20, NOW - 20, value, 24));
        buffer.add(record(20, NOW - 10, 4, 24));

        expect(buffer.mean(20)).to.equal(3);
      });
    });

    it('is 0 when the channel holds no numeric value', () => {
      const buffer = createBuffer();
      buffer.add(record(20, NOW - 10, NaN, 24));

      expect(buffer.mean(20)).to.equal(0);
    });
  });
});
