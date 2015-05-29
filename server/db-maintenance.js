'use strict';

var db = require('./db');

var oneDay = 1000 * 60 * 60 * 24;

function execRefreshMaterializedView(viewName, cb) {
  console.log('started execRefreshMaterializedView:', viewName, Date.now());
  db.refreshMaterializedView(viewName, function (err, res) {

    console.log('finished execRefreshMaterializedView:', viewName, Date.now(), err || 'success');

    cb(err, res);
  });
}

function refreshTelemetryStatsView(interval) {

  execRefreshMaterializedView('telemetry_stats_view', function (err, res) {

    setTimeout(function () { refreshTelemetryStatsView(interval); }, interval);
  });
}

refreshTelemetryStatsView(oneDay);
