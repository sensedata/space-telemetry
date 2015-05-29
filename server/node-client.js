var dd = require('./data_dictionary');

// connect to a local dev server
var socket = require('socket.io-client')('http://0.0.0.0:6001');

// listen for when a connection is established
socket.on('connect', function () {

  console.log('connected');

  // query for AIRLOCK000049 - 5000 seconds ago, 50 records max
  // socket.emit(dd.hash.AIRLOCK000049, 5000, 5);
  // query for NODE3000011 - 5000 seconds ago, 50 records max
  // socket.emit(dd.hash.NODE3000011, 5000, 5);
  // query for AIRLOCK000049 - most recent record (seconds ago param must be null)
  // socket.emit(dd.hash.AIRLOCK000049, null, -1);
  // query for STATUS - 5000 seconds ago, 50 records max
  // socket.emit(dd.hash.STATUS, 5000, 50);
  // query for STATUS -  most recent record (seconds ago param must be null)
  // socket.emit(dd.hash.STATUS, null, -1);
  // socket.emit(dd.hash.TIME_000001, 9999, 100);
});

// listen for feed status
socket.on(dd.hash.STATUS, function (data) {

  console.log('status: ' + JSON.stringify(data));
});

// listen for AIRLOCK000049 updates

socket.on(dd.hash.AIRLOCK000049, function (data) {

  console.log('AIRLOCK000049: ' + JSON.stringify(data));
});

// listen for NODE3000011 updates
socket.on(dd.hash.NODE3000011, function (data) {

  console.log('NODE3000011: ' + JSON.stringify(data));
});

socket.on(dd.hash.TIME_000001, function (data) {

  console.log('TIME_000001: ' + JSON.stringify(data));
});

