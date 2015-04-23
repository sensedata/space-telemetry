var db = require('../db');


db.selectMostRecentByType('AIRLOCK000049', function(err, res) {

  if (err) { return; }

  console.log(res.rows);
});