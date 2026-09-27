'use strict';

const assert = require('assert');
const path = require('path');

const {start} = require(path.join(__dirname, '..', '..', 'server', 'replay'));

describe('replay arguments', () => {
  it('rejects an unknown option with usage text naming the server entry point', () =>
    assert.rejects(start(['--session', '1789211888321']), {
      name: 'TypeError',
      message: /^usage: SOURCE=replay node server\/server\.js /
    }));

  [
    ['zero', '0'],
    ['not a number', 'fast']
  ].forEach(([kind, rate]) => {
    it(`rejects a --rate of ${kind}`, () =>
      assert.rejects(start(['--rate', rate]), RangeError));
  });
});
