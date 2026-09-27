/*jshint mocha:true*/

var expect = require('chai').expect;
var assert = require('chai').assert;

var utils = require('../../server/utils');

describe('Time Series', function () {

  it('getTimeBasedId', function () {

    var t1 = utils.getTimeBasedId(),
    t2 = utils.getTimeBasedId();

    assert(t1 <= t2, 't1 should be less than or equal to t2');
  });

  it('getTimeBasedId async', function (done) {

    var t1 = utils.getTimeBasedId();

    setTimeout(function () {

      var t2 = utils.getTimeBasedId();

      assert(t1 < t2, 't1 should be less than t2');

      done();
    }, 500);
  });
});

describe('Object Hash Clone', function () {

  it('clone', function () {

    var obj1 = { one: 1, two: 'two', three: Date.now() };
    var obj2 = utils.clone(obj1);

    expect(obj1).to.deep.equal(obj2);
  });

  it('clone - changing obj2 should not affect obj1', function () {

    var obj1 = { one: 1, two: 'two', three: Date.now() };
    var obj2 = utils.clone(obj1);

    delete obj2.three;

    expect(obj1).to.not.deep.equal(obj2);
  });
});
