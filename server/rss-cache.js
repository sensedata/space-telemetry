var clone = require("./utils").clone;
var cache = {};

function get() {
  return clone(cache);
}

function put(key, value) {

  cache[key] = value;
}

function flush() {

  cache = {};
}

exports.get = get;
exports.put = put;
exports.flush = flush;
