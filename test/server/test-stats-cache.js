/*jshint mocha:true*/

require('dotenv').load({path: '.env.test'});
var assert = require('chai').assert;

var statsCache = require('../../server/stats-cache');

describe('Stats Cache', function () {

  describe('I/O', function () {

    it('cache miss', function () {

      var value = statsCache.get(9999);

      assert.isUndefined(value, 'value should be undefined');
    });

    it('cache hit', function () {

      var inValue = {key: 'value'};

      statsCache.put(9999, inValue);

      var outValue = statsCache.get(9999);

      statsCache.flush();

      assert.deepEqual(inValue, outValue, 'value in should equal value out');
    });

    it('cache flush', function () {

      var inValue = {key: 'value'};

      statsCache.put(9999, inValue);

      statsCache.flush();

      var outValue = statsCache.get(9999);

      assert.isUndefined(outValue, 'value should be undefined');
    });
  });
});
