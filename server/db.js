'use strict';

var _ = require('highland');

var pg = require('pg');
var QueryStream = require('pg-query-stream');

var ls = require('./lightstreamer');

var utils = require('./utils');

var notify = require('./notification');

var dd = require('./data_dictionary');

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

      notify.error(err);

      return cb(err);
    }

    client.query('select * from telemetry where idx = $1 and ts = ' +
      '(select max(ts) from telemetry where idx = $1) ' +
      'order by status desc limit 1',
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

      notify.error(err);

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

      notify.error(err);

      return cb(err);
    }

    client.query('select avg(lag_avg) as lag_avg,' +
      ' avg(lag_stddev) as lag_stddev, sum(tick_count) as tick_count, avg(value_avg) as val_avg,' +
      ' avg(value_stddev) as val_stddev from telemetry_session_stats where idx = $1',
      [idx],
      function (err2, res) {

        done();
        cb(err2, res);
      });
  });
}

exports.selectStatsByIdx = selectStatsByIdx;

var previousSessionId = 0;

ls.dataStream.fork().each(function (data) {

  if (!utils.isReadOnly()) {

    pg.connect(psql, function (err, client, done) {

      if (err) {

        notify.error(err);

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

            notify.error(err2);

            return console.error('Error inserting data', err2);
          }

          if (previousSessionId !== data.sid) {

            client.query('insert into session (session_id) values ($1)',
            [data.sid],

            function (err3) {

              done();

              previousSessionId = data.sid;

              if (err3 && err3.code !== '23505') {

                notify.error(err3);

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

function addTelemetryStats(data, cb) {

  if (!Array.isArray(data)) {

    data = [data];
  }

  selectStatsByIdx(data[0].k, function (err, res) {

    if (err || res.rows.length === 0) {
      // keep chugging along, even if there was an error
      data = data.map(function (d) {

        d.lm = 0;
        d.ld = 0;
        d.vc = 0;
        d.vm = 0;
        d.vd = 0;

        return d;
      });

      if (err) {

        console.error(err);

        notify.error(err);
      }

      return cb(null, data);
    }

    data = data.map(function (d) {

      d.lm = res.rows[0].lag_avg || 0;
      d.ld = res.rows[0].lag_stddev || 0;
      d.vc = res.rows[0].tick_count || 0;
      d.vm = res.rows[0].val_avg || 0;
      d.vd = res.rows[0].val_stddev || 0;

      return d;
    });

    cb(null, data);
  });

}

exports.addTelemetryStats = addTelemetryStats;


function getTelemetryData(idx) {

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
}

exports.getTelemetryData = getTelemetryData;

function addStats(idx) {

  return _.wrapCallback(function (rows, next) {

    var data = rows.map(function (r) {
      return {
        k: idx,
        v: r.value,
        t: r.ts.getTime() / 1000 | 0,
        s: r.status,
        lm: 0,
        ld: 0,
        vc: 0,
        vm: 0,
        vd: 0
      };
    });

    addTelemetryStats(data, next);
  });
}

exports.addStats = addStats;

function getTelemetrySessionStatsGaps(cb) {

  pg.connect(psql, function (err, client, done) {

    var query, stream;

    if (err) {

      console.error('Error requesting postgres client', err);

      notify.error(err);

      return cb(err);
    }

    query = new QueryStream('select * from get_telemetry_session_stats_gaps($1)',
      [dd.list.length - 1]);

    stream = client.query(query);
    stream.on('end', done);

    cb(err, stream);
  });
}

exports.getTelemetrySessionStatsGaps = getTelemetrySessionStatsGaps;

function getTelemetrySessionStatsBySessionIdIdx(sessionId, idx, cb) {

  pg.connect(psql, function (err, client, done) {

    if (err) {

      console.error('Error requesting postgres client', err);

      notify.error(err);

      return cb(err);
    }

    client.query('select * from get_telemetry_session_stats($1, $2)',
      [sessionId, idx],
      function (err2, res) {

        done();
        cb(err2, res);
      });
  });
}

exports.getTelemetrySessionStatsBySessionIdIdx = getTelemetrySessionStatsBySessionIdIdx;

function saveTelemetrySessionStatsBySessionIdIdx(
    session_id,
    idx,
    tick_count,
    delta_count,
    delta_ts_min,
    delta_ts_max,
    value_min,
    value_max,
    value_avg,
    value_stddev,
    lag_min,
    lag_max,
    lag_avg,
    lag_stddev,
    cb) {

  if (!utils.isReadOnly()) {

    pg.connect(psql, function (err, client, done) {

      if (err) {

        console.error('Error requesting postgres client', err);

        notify.error(err);

        return cb(err);
      }

      client.query('insert into telemetry_session_stats(' +
      'idx, session_id, tick_count, delta_count, delta_ts_min, ' +
      'delta_ts_max, value_min, value_max, ' +
      'value_avg, value_stddev, lag_min, lag_max, lag_avg, ' +
      'lag_stddev) values ($1, $2, $3, $4, ' +
      '$5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
      [
        idx,
        session_id,
        tick_count,
        delta_count,
        delta_ts_min,
        delta_ts_max,
        value_min,
        value_max,
        value_avg,
        value_stddev,
        lag_min,
        lag_max,
        lag_avg,
        lag_stddev
      ],
      function (err2, res) {

        done();
        cb(err2, res);
      });
    });
  }
}

exports.saveTelemetrySessionStatsBySessionIdIdx = saveTelemetrySessionStatsBySessionIdIdx;
