/*jshint node:true*/

// connect to a local dev server
var socket = require('socket.io-client')('http://0.0.0.0:6001');

// listen for when a connection is established
socket.on('connect', function(){
  
  console.log('connect');
  
  // socket.emit('AIRLOCK000021', Date.now()/1000|0 - 1000);
  socket.emit('AIRLOCK000021', -1);
  
  // socket.emit('AIRLOCK000049', Date.now()/1000|0 - 1000);
  
  
});

// listen for feed status
socket.on('STATUS', function(data){
  
  console.log("status: " + JSON.stringify(data));
});

// listen for AIRLOCK000021 updates
socket.on('AIRLOCK000021', function(data){
  
  console.log("AIRLOCK000021: " + JSON.stringify(data));
});

// listen for AIRLOCK000049 updates
socket.on('AIRLOCK000049', function(data){
  console.log(data);
  // data.forEach(function(record) {
  //   console.log(JSON.stringify(record));
  // });
  // console.log("AIRLOCK000049: " + JSON.stringify(data));
});


// listen for when a connection is lost
socket.on('disconnect', function() {
  
  console.log('disconnect');
});

// query for the feed status every 5 seconds
// setInterval(function () {
//
//   socket.emit('STATUS');
//
// }, 5000);
