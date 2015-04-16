/*jshint node:true*/

// Postgresql database connectivity
var pg = require('pg');

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
    
    client.query('select * from data where idx = $1 and ts = (select MAX(ts) from data where idx = $1)',
      [dataDictionary.hash[type]],
      function(err, res) {
        
        done();
        cb(err, res);
    });    
  });
};

exports.insertTelemetryData = function (name, value, timestamp) {
  // if we are not in BlueMix add new data
  // only load data to the production env via Heroku
  if(!utils.isBluemix()) {
    
    pg.connect(psql, function(err, client, done) {
      
      if (err) {
        return console.error('Error requesting postgres client', err);
      }

      client.query('insert into data (idx, value, ts) values ($1, $2, to_timestamp($3))',
      [dataDictionary.hash[name], value, timestamp],

      function(err, res) {
        done();

        if (err) {
          return console.error('Error inserting data', err);
        }
      });
    });
  }
};

// DDL

// // On startup, create the table if it does not exist.
// pg.connect(psql, function(err, client, done) {
//   if (err) {
//     return console.error('Error requesting client', err);
//   }
//
//   client.query('drop table if exists data',
//   function (err, result) {
//     if (err) {
//       done();
//       return console.error('Error dropping table data', err);
//     }
//
//     client.query('create table if not exists data(idx smallint, value double precision, ts timestamp without time zone)',
//     function (err, result) {
//       done();
//       if (err) {
//         return console.error('Error creating table data', err);
//       }
//     });
//
//   });
// });