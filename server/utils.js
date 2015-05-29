// are we operating in the IBM BlueMix env?
exports.isBluemix = function () {
  return !!process.env.VCAP_APP_PORT;
};

exports.isReadOnly = function () {
  return exports.isBluemix() || !!process.env.READ_ONLY;
};

// are we operating in Heroku env?
exports.isHeroku = function () {
  return !!process.env.PORT;
};

// return pseudo UUID based on time
exports.getTimeBasedId = function () {
  return Date.now();
};

// return standard deviation 'distance'
exports.calcStandardDeviationDistance = function (value, avg, stddev) {

  if (stddev === 0) {
    // avoid NaN
    return 0;
  }

  return (value - avg) / stddev;
};

// return a clone/copy
exports.clone = function (obj) {
  var ret = {};
  for (var key in obj) {
    ret[key] = obj[key];
  }
  return ret;
};
