/*jshint node:true*/

// Postgresql database connectivity
var pg = require('pg');

var ls = require('./lightstreamer');

var utils = require('./utils');

var dataDictionary = require('./data_dictionary');

// Postgres confg
var psql;

// operating in BlueMix or Heroku
if (utils.isBluemix() || utils.isHeroku()) {
  
  psql = process.env.DATABASE_URL;

} else {
  // or locally
  psql = {
      database: "iss_telemetry",
      host: "0.0.0.0",
      port: 5432,
      user: "",
      password: "",
      ssl: false
  };
}

exports.selectByTypeUnixtime = function (type, unixtime, cb) {
  
  pg.connect(psql, function(err, client, done) {
    
    if (err) {
      console.error('Error requesting postgres client', err);
      return cb(err);
    }
    
    client.query(
      'SELECT * from data where idx = $1 and ts > to_timestamp($2) order by ts asc',
      // "select date_trunc('minute', ts) + date_part('second', ts)::int / 10 * interval '10 sec' as ts, avg(value) as value from data where idx = $1 and ts > to_timestamp($2) group by date_trunc('minute', ts) + date_part('second', ts)::int / 10 * interval '10 sec' order by date_trunc('minute', ts) + date_part('second', ts)::int / 10 * interval '10 sec'",
      [dataDictionary.hash[type], unixtime],
      function(err, res) {
        
          done();
          cb(err, res);
    });
  });
};

exports.selectMostRecentByType = function (type, cb) {

  pg.connect(psql, function(err, client, done) {
    
    if (err) {
      console.error('Error requesting postgres client', err);
      return cb(err);
    }
    
    client.query('select * from data where idx = $1 order by ts desc limit 1',
      [dataDictionary.hash[type]],
      function(err, res) {
        
        done();
        cb(err, res);
    });    
  });
};


var dataStream = ls.dataStream.fork().each(function(data) {

  if(!utils.isBluemix()) {
    
    pg.connect(psql, function(err, client, done) {
      
      if (err) {
        return console.error('Error requesting postgres client', err);
      }

      client.query('insert into data (idx, value, ts) values ($1, $2, to_timestamp($3))',
      [dataDictionary.hash[data.n], data.v, data.t],

      function(err, res) {
        done();

        if (err) {
          return console.error('Error inserting data', err);
        }
      });
    });
  }
  // console.log(data);
});

var lastKnownStatus;

var statusStream = ls.statusStream.fork().each(function(status) {

  lastKnownStatus = status;
  // console.log(status);
});
