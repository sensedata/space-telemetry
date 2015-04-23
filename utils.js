/*jshint node:true*/

// are we operating in the IBM BlueMix env?
exports.isBluemix = function () {
  return !!process.env.VCAP_APP_PORT;
};

// are we operating in Heroku env?
exports.isHeroku = function () {
  return !!process.env.PORT;
};

// return pseudo UUID based on time
exports.getTimeBasedId = function () {
  return Date.now();
};

// return pseudo UUID based on time
exports.calcStandardDeviationDistance = function (value, avg, stddev) {

  return (value-avg)/stddev;
};