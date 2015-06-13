// are we operating in a read-only env?
exports.isReadOnly = function () {
  return !!process.env.READ_ONLY;
};

// is this a production environment?
exports.isProductionEnv = function () {
  return process.env.NODE_ENV === 'production';
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

//merge obj2 into obj1, return obj1
exports.merge = function (obj1, obj2) {
  for (var key in obj2) {
    obj1[key] = obj2[key];
  }
  return obj1;
};
