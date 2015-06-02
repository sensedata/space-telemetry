// are we operating in a read-only env?
exports.isReadOnly = function () {
  return !!process.env.READ_ONLY;
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
