/*jshint node:true*/

// are we operating in the IBM BlueMix env?
exports.isBluemix = function () {
  return !!process.env.VCAP_APP_PORT;
};

// are we operating in Heroku env?
exports.isHeroku = function () {
  return !!process.env.PORT;
};
