// The one stream of telemetry records into the server. Producers (the Lightstreamer adapter
// or the replayer) emit 'data' with {k, v, cv, t, s, sid}; consumers never know which
// producer is running.
var EventEmitter = require('events').EventEmitter;

module.exports = new EventEmitter();
