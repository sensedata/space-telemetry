'use strict';

var _ = require('highland');

var db = require('./db');

var notify = require('./notification');

var utils = require('./utils');

var statsCache = require('./stats-cache');

var oneDay = 1000 * 60 * 60 * 24;

function getTelemetrySessionStatsBySessionIdIdxWrapper(params, next) {

  db.getTelemetrySessionStatsBySessionIdIdx(params.session_id, params.idx, function (err, res) {

    if (err) {

      next(err);
      return;
    }

    next(null, res.rows[0]);
  });
}

function saveTelemetrySessionStatsBySessionIdIdxWrapper(params, next) {

  db.saveTelemetrySessionStatsBySessionIdIdx(
    params.session_id,
    params.idx,
    params.tick_count,
    params.delta_count,
    params.delta_ts_min,
    params.delta_ts_max,
    params.value_min,
    params.value_max,
    params.value_avg,
    params.value_stddev,
    params.lag_min,
    params.lag_max,
    params.lag_avg,
    params.lag_stddev,
    function (err, res) {

      if (err) {

        next(err);
        return;
      }

      next(null);
    });
}

function execBuildTelemetrySessionStats(cb) {

  db.getTelemetrySessionStatsGaps(function (err, stream) {

    if (err) {

      return notify.error(err);
    }

    _(stream)
    .flatMap(_.wrapCallback(getTelemetrySessionStatsBySessionIdIdxWrapper))
    .flatMap(_.wrapCallback(saveTelemetrySessionStatsBySessionIdIdxWrapper))
    .stopOnError(function (err2) {

      cb(err2);
    })
    .done(function () {

      cb(err);

    });
  });
}

function buildTelemetrySessionStats(interval) {

  console.log('started buildTelemetrySessionStats:', Date.now());

  execBuildTelemetrySessionStats(function (err, res) {

    console.log('finished buildTelemetrySessionStats:', Date.now(), err || 'success');

    // stats are now updated in db, flush local cache
    statsCache.flush();

    setTimeout(function () { buildTelemetrySessionStats(interval); }, interval);
  });
}

if (!utils.isReadOnly()) {

  buildTelemetrySessionStats(oneDay);

} else {
  // if the server instance is read-only
  // take a guess as when to flush stats cache

  setInterval(function () { statsCache.flush(); }, oneDay);
}
