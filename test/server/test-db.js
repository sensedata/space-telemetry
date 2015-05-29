require('dotenv').load({path: '.env.test'});

var db = require('../../server/db');


db.selectStatsByIdx(77, function (err, res) {

  if (err) { return; }
});
