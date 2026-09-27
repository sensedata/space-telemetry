'use strict';

const http = require('http');
const express = require('express');
const socketIo = require('socket.io');

const createBuffer = require('./buffer');
const dd = require('./data_dictionary');
const persist = require('./persist');
const rss = require('./rss');
const rssCache = require('./rss-cache');
const source = require('./source');

const port = process.env.PORT || 5000;
const host = '0.0.0.0';

const STATUS = dd.hash.STATUS;

const app = exports.app = express();
const server = exports.server = http.createServer(app);
const io = exports.io = socketIo(server);

const buffer = createBuffer();
if (process.env.DATA_DIR) {
  persist.keep(buffer, process.env.DATA_DIR, Number(process.env.SNAPSHOT_SECONDS || 30));
}

// The client reads only vm, as the marker of a bullet chart; the other statistics are
// sent as zero.
function toClient(k, records) {
  const vm = buffer.mean(k);
  return records.map(({v, t, s}) => ({k, v, t, s, lm: 0, ld: 0, vc: 0, vm, vd: 0}));
}

app.get('/rss.xml', (req, res) => {
  res.set('Content-Type', 'application/rss+xml');
  res.send(rss.getRss());
});

app.use(express.static(__dirname + '/../public', {maxAge: '5m'}));

server.listen(port, host, () => {
  console.log('server starting on host: ' + host + ', port: ' + server.address().port);
});

// Require feed-status before source.on(): it listens to source, and on TIME_000001 it
// emits STATUS first, so clients get STATUS before the time record.
const feedStatus = require('./feed-status');
source.on('data', record => {
  buffer.add(record);
  rssCache.put(dd.list[record.k], record);
  io.emit(record.k, toClient(record.k, [record]));
});

io.on('connection', socket => {
  dd.list.forEach((name, k) => {
    socket.on(k, (intervalAgo, count) => {
      socket.emit(k, toClient(k, buffer.query(k, intervalAgo, count)));
    });
  });

  socket.emit(STATUS, toClient(String(STATUS), buffer.query(STATUS, 0, -1)));
});

// Until TIME_000001 arrives the feed is not known to be up; this record also gives a client
// STATUS on connection.
feedStatus.reportDisconnected();

const sourceName = process.env.SOURCE || 'lightstreamer';
if (sourceName === 'lightstreamer') {
  require('./lightstreamer');
} else if (sourceName === 'replay') {
  require('./replay').start(process.argv.slice(2));
} else if (sourceName !== 'none') {
  throw new RangeError('SOURCE must be lightstreamer, replay or none: ' + sourceName);
}
