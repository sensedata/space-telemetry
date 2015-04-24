/*jshint node:true*/

// Postgresql database connectivity
var _ = require('highland');

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
      'SELECT * from telemetry where idx = $1 and ts > to_timestamp($2) order by ts asc',
      // "select date_trunc('minute', ts) + date_part('second', ts)::int / 10 * interval '10 sec' as ts, avg(value) as value from data where idx = $1 and ts > to_timestamp($2) group by date_trunc('minute', ts) + date_part('second', ts)::int / 10 * interval '10 sec' order by date_trunc('minute', ts) + date_part('second', ts)::int / 10 * interval '10 sec'",
      [dataDictionary.hash[type], unixtime],
      function(err, res) {
        
          done();
          cb(err, res);
    });
  });
};

exports.selectMostRecentByIdx = function (idx, cb) {

  pg.connect(psql, function(err, client, done) {
    
    if (err) {
      console.error('Error requesting postgres client', err);
      return cb(err);
    }
    
    client.query('select * from telemetry where idx = $1 order by ts desc limit 1',
      [idx],
      function(err, res) {
        
        done();
        cb(err, res);
    });    
  });
};

exports.selectMostRecentByIdxIntervalAgoCount = function (idx, intervalAgo, count, cb) {

  pg.connect(psql, function(err, client, done) {
    
    var now = Date.now()/1000|0;
    if (err) {
      console.error('Error requesting postgres client', err);
      return cb(err);
    }
    
    count = count || 1;
    if (count < 1) {
      
      count = 1;
      intervalAgo = now;
      
    } else {
      
      intervalAgo = intervalAgo || now;
      if (intervalAgo < 1) intervalAgo = now;
    }
    
    
    
    client.query('with top_x as (select * from telemetry where idx = $1 and ts >= to_timestamp($2) order by ts desc limit $3) select * from top_x order by ts asc',
      [idx, now - intervalAgo, count],
      function(err, res) {
        
        done();
        cb(err, res);
    });    
  });
};

exports.selectStatusesByIntervalAgoCount = function (intervalAgo, count, cb) {

  pg.connect(psql, function(err, client, done) {
    
    var now = Date.now()/1000|0;
    
    if (err) {
      console.error('Error requesting postgres client', err);
      return cb(err);
    }
    
    count = count || 1;
    if (count < 1) {
      
      count = 1;
      intervalAgo = now;
      
    } else {
      
      intervalAgo = intervalAgo || now;
      if (intervalAgo < 1) intervalAgo = now;
    }
    
    client.query('with top_x as (select * from status where ts >= to_timestamp($1) order by ts desc limit $2) select * from top_x order by ts asc',
      [now - intervalAgo, count],
      function(err, res) {
        
        done();
        cb(err, res);
    });    
  });
};

exports.selectStatsByIdx = function (idx, cb) {

  pg.connect(psql, function(err, client, done) {
    
    if (err) {
      console.error('Error requesting postgres client', err);
      return cb(err);
    }
    
    client.query('select avg(a) as a, avg(sd) as sd from get_telemetry_time_interval_avg_stddev($1)',
    [idx],
      function(err, res) {

        done();
        cb(err, res);
    });    
  });
};

var previousSessionId = 0;

var dataStream = ls.dataStream.fork().each(function(data) {

  // do not add any values if in IBM Bluemix env
  // skip over TIME_000001 values
  if((!utils.isBluemix()) && (data.i !== 296)) {
    
    pg.connect(psql, function(err, client, done) {
      
      if (err) {
        return console.error('Error requesting postgres client', err);
      }

      client.query('insert into telemetry (idx, value, value_calibrated, ts, status, session_id) values ($1, $2, $3, to_timestamp($4), $5, $6)',
      [data.i, data.v, data.cv, data.t, data.s, data.sid],

      function(err, res) {
        // suppress logging unique constraint violations
        // this can happen during normal ops
        // this occurs during a lightstreamer re-connect typically
        if (err && (err.code !== '23505')) {
          
          done();
          return console.error('Error inserting data', err);
        }
        
        if (previousSessionId !== data.sid) {

          client.query('insert into session (session_id) values ($1)',
          [data.sid],

          function(err, res) {
            done();
            
            previousSessionId = data.sid;
            
            if (err && (err.code !== '23505')) {
          
              return console.error('Error inserting data', err);
            }
            
          });
          
        } else {
          
          done();
        }
        
      });
    });
  }
  // console.log(data);
});

var statusStream = ls.statusStream.fork().each(function(status) {
  
  if(!utils.isBluemix()) {
    
    pg.connect(psql, function(err, client, done) {
      
      if (err) {
        return console.error('Error requesting postgres client', err);
      }

      client.query('insert into status (connected, ts) values ($1, to_timestamp($2))',
      [status.c, status.t],

      function(err, res) {
        done();
        
        if (err) {
          
          return console.error('Error inserting data', err);
        }
      });
    });
  }
  // console.log(status);
});

var previousIdxTimeHash = {};

exports.addStats = _.wrapCallback(function (data, next) {

  exports.selectStatsByIdx(data.i, function(err, res) {
    var avg = 0,
    stddev = 0,
    previousTime = previousIdxTimeHash[data.k],
    sdd = 0;

    if (err) {
      // keep chugging along, even if there was an error
      data.m = 0;
      data.d = 0;
      
      next(null, data);
      return;
    }

    if ((res.rows.length > 0) && previousTime) {

      avg = res.rows[0].a;
      stddev = res.rows[0].sd;
      sdd = utils.calcStandardDeviationDistance(data.t - previousTime, avg, stddev);
    }

    previousIdxTimeHash[data.k] = data.t;
    
    data.m = avg;
    data.d = sdd;
    
    next(null, data);
  });
});


