var _ = require('highland');

var pg = require('pg');

var ls = require('./lightstreamer');

var utils = require('./utils');

// Postgres confg
var psql = process.env.DATABASE_URL;

if (utils.isReadOnly()) {
  console.log('Running in read-only mode.');

} else {
  console.log('Running in READ-WRITE mode.');
}

console.log('Connecting to', psql);

function selectMostRecentByIdx(idx, cb) {

  pg.connect(psql, function (err, client, done) {

    if (err) {

      console.error('Error requesting postgres client', err);
      return cb(err);
    }

    client.query('select * from telemetry where idx = $1 order by ts desc, status desc limit 1',
      [idx],
      function (err2, res) {

        done();
        cb(err2, res);
      });
  });
}

function selectMostRecentByIdxIntervalAgoCount(idx, intervalAgo, count, cb) {

  pg.connect(psql, function (err, client, done) {

    var now = Date.now() / 1000 | 0;

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

      if (intervalAgo < 1) {

        intervalAgo = now;
      }
    }

    client.query('with top_x as (select * ' +
      'from telemetry where idx = $1 and ts >= to_timestamp($2) ' +
      'order by ts desc, status desc limit $3) select * from top_x order by ts asc',
      [idx, now - intervalAgo, count],
      function (err2, res) {

        done();
        cb(err2, res);
      });
  });
}

function selectStatsByIdx(idx, cb) {

  pg.connect(psql, function (err, client, done) {

    if (err) {

      console.error('Error requesting postgres client', err);
      return cb(err);
    }

    client.query('select * from telemetry_stats_view where idx = $1',
      [idx],
      function (err2, res) {

        done();
        cb(err2, res);
      });
  });
}

var previousSessionId = 0;

ls.dataStream.fork().each(function (data) {

  // do not add any values if in IBM Bluemix env
  // skip over TIME_000001 values
  if (!utils.isReadOnly()) {

    pg.connect(psql, function (err, client, done) {

      if (err) {

        return console.error('Error requesting postgres client', err);
      }

      client.query('insert into telemetry ' +
        '(idx, value, value_calibrated, ts, status, session_id) ' +
        'values ($1, $2, $3, to_timestamp($4), $5, $6)',
        [data.k, data.v, data.cv, data.t, data.s, data.sid],

        function (err2) {
          // suppress logging unique constraint violations
          // this can happen during normal ops
          // this occurs during a lightstreamer re-connect typically
          if (err2 && err2.code !== '23505') {

            done();
            return console.error('Error inserting data', err2);
          }

          if (previousSessionId !== data.sid) {

            client.query('insert into session (session_id) values ($1)',
            [data.sid],

            function (err3) {

              done();

              previousSessionId = data.sid;

              if (err3 && err3.code !== '23505') {

                return console.error('Error inserting data', err3);
              }

            });

          } else {

            done();
          }

        });
    });
  }
});

var previousIdxTimeHash = {};

exports.addCurrentStats = function (data, next) {

  selectStatsByIdx(data.k, function (err, res) {
    var lag_avg = 0,
    lag_stddev = 0,
    val_avg = 0,
    val_stddev = 0,
    previousTime = previousIdxTimeHash[data.k],
    lag_sd = 0,
    val_sd = 0;

    if (err) {
      // keep chugging along, even if there was an error
      data.m = 0;
      data.d = 0;
      data.vm = 0;
      data.vd = 0;

      next(null, [data]);
      return;
    }

    if (res.rows.length > 0 && previousTime) {

      lag_avg = res.rows[0].lag_avg;
      lag_stddev = res.rows[0].lag_stddev;
      val_avg = res.rows[0].val_avg;
      val_stddev = res.rows[0].val_sd;
      lag_sd = utils.calcStandardDeviationDistance(data.t - previousTime, lag_avg, lag_stddev);
      val_sd = utils.calcStandardDeviationDistance(data.v, val_avg, val_stddev);
    }

    previousIdxTimeHash[data.k] = data.t;

    data.m = lag_avg || 0;
    // check for Infinity (div by zero)
    data.d = lag_sd === Infinity ? 0 : lag_sd;

    data.vm = val_avg;
    data.vd = val_sd === Infinity ? 0 : val_sd;

    next(null, [data]);
  });
};

exports.getTelemetryData = function (idx) {

  return _.wrapCallback(function (params, next) {

    // unixtime of -1 indicates the client wants the latest record available
    if (params.count === -1) {

      selectMostRecentByIdx(idx, function (err, res) {

        if (err) {

          next(err);
          return;
        }

        next(null, res.rows);
      });

    } else {
      // get a list of records later than intervalAgo of a idx
      selectMostRecentByIdxIntervalAgoCount(idx, params.intervalAgo, params.count,
        function (err, res) {

          if (err) {

            next(err);
            return;
          }

          // if no records found, get the latest
          if (res.rows.length === 0) {

            selectMostRecentByIdx(idx, function (err2, res2) {

              if (err2) {

                next(err2);
                return;
              }

              next(null, res2.rows);
            });

          } else {

            next(null, res.rows);
          }
        });
    }
  });
};

exports.addStats = function (idx) {

  return _.wrapCallback(function (rows, next) {

    var data;
    var interval = null;

    data = rows.map(function (r) {
      return {
        k: idx,
        v: r.value,
        t: r.ts.getTime() / 1000 | 0,
        s: r.status,
        m: 0,
        d: 0,
        vm: 0,
        vd: 0
      };
    });

    if (data.length >= 2) {

      interval = data[data.length - 1].t - data[data.length - 2].t;
    }

    selectStatsByIdx(idx, function (err, res) {
      var lag_sd, val_sd;

      if (err) {

        next(err);
        return;
      }

      if (interval !== null && res.rows.length > 0) {

        lag_sd = utils.calcStandardDeviationDistance(
          interval, res.rows[0].lag_avg, res.rows[0].lag_stddev);

        data.forEach(function (d) {
          d.d = lag_sd || 0;
          d.m = res.rows[0].lag_avg || 0;
        });

      }

      val_sd = utils.calcStandardDeviationDistance(
        data[0].v, res.rows[0].val_avg, res.rows[0].val_sd);

      data.forEach(function (d) {
        d.vd = val_sd;
        d.vm = res.rows[0].val_avg;
      });

      next(null, data);
    });
  });
};

exports.selectStatsByIdx = selectStatsByIdx;


function refreshMaterializedView(viewName, cb) {

  pg.connect(psql, function (err, client, done) {

    if (err) {

      console.error('Error requesting postgres client', err);
      return cb(err);
    }

    client.query('refresh materialized view concurrently ' + viewName,
      [],
      function (err2, res) {

        done();
        cb(err2, res);
      });
  });
}

exports.refreshMaterializedView = refreshMaterializedView;
