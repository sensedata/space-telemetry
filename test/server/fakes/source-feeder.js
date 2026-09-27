'use strict';

// Preloaded with `node -r` into the server under test, so a test can feed its source over IPC.
const path = require('path');

const source = require(path.join(__dirname, '..', '..', '..', 'server', 'source'));

process.on('message', records => {
  records.forEach(record => source.emit('data', record));
  process.send('fed');
});
