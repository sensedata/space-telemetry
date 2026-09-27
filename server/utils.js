exports.getTimeBasedId = function () {
  return Date.now();
};

exports.clone = function (obj) {
  var ret = {};
  for (var key in obj) {
    ret[key] = obj[key];
  }
  return ret;
};
