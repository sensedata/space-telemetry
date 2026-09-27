// Connects to a running server with the repository's own socket.io-client 1.3.7
// and exercises the bundle's contract: subscribe by emitting a channel number with
// (intervalAgo, count), expect an array of records on that number.
//
//   PORT=5055 node harness/probe.js [TELEMETRY_ID ...]
//
// Without arguments it subscribes to USLAB000059, TIME_000001 and STATUS.
'use strict';

const path = require('path');

const root = path.join(__dirname, '..');
const io = require(path.join(root, 'node_modules', 'socket.io-client'));
const dd = require(path.join(root, 'server', 'data_dictionary'));

const requested = process.argv.slice(2);
const names = requested.length > 0 ? requested : ['USLAB000059', 'TIME_000001', 'STATUS'];

const socket = io('http://localhost:' + (process.env.PORT || 5055));
const seen = {};

function log(...args) {
  console.log('[probe ' + new Date().toISOString() + ']', ...args);
}

socket.on('connect', () => {
  log('connected');
  names.forEach(name => {
    const channel = dd.hash[name];
    if (channel === undefined) {
      log('unknown telemetry id', name);
      return;
    }
    socket.on(channel, data => {
      if (!seen[channel]) {
        log('channel', channel, name, 'first message', JSON.stringify(data).slice(0, 300));
      }
      seen[channel] = (seen[channel] || 0) + 1;
    });
    socket.emit(channel, 450, 150);
  });
});

socket.on('disconnect', () => log('disconnected'));
socket.on('error', err => log('error', err));
socket.on('connect_error', err => log('connect_error', err && err.message));

setTimeout(() => {
  log('message counts by channel', JSON.stringify(seen));
  process.exit(0);
}, 15000);
