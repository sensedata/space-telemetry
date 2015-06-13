var cache = {};

function get(key) {

  return cache[key];
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
