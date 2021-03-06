/*jshint mocha:true*/

require('dotenv').load({path: '.env.test'});
var expect = require('chai').expect;
var assert = require('chai').assert;

var utils = require('../../server/utils');

describe('Operational Environment', function () {

  describe('ReadOnly', function () {

    it('isReadOnly', function () {

      process.env.READ_ONLY = 1;
      expect(utils.isReadOnly()).to.equal(true);
    });

    it('isReadOnly NOT', function () {

      delete process.env.READ_ONLY;
      expect(utils.isReadOnly()).to.equal(false);
    });
  });
});

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

      assert(t1 = t2, 't1 should be less than t2');

      done();
    }, 500);
  });
});

describe('Standard Deviation', function () {

  it('calcStandardDeviationDistance', function () {

    var sdd = utils.calcStandardDeviationDistance(
      1, 1, 1);

    expect(sdd).to.equal(0);
  });

  it('calcStandardDeviationDistance div by zero', function () {

    var sdd = utils.calcStandardDeviationDistance(1, 1, 0);

    assert(sdd === 0, 'should be equal to 0');
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

describe('Object Hash Merge', function () {

  it('merge', function () {

    var obj1 = { one: 1, two: 'two', three: 3 };

    var obj2 = { one: 2, four: 4 };

    var obj3 = utils.merge(obj1, obj2);

    var obj4 = { one: 2, two: 'two', three: 3, four: 4 }

    expect(obj3).to.deep.equal(obj4);
  });
});
