/**
 * Converts an ISS feed TimeStamp, decimal hours since the start of the year, to unix
 * seconds. 24 is subtracted from the hours and the year is taken from `now`; the client
 * has always displayed this arithmetic's output, though neither rule is verified against
 * the feed. The result is truncated to a 32-bit integer.
 */
module.exports = function feedTimeToUnix(hours, now) {
  var yearStart = Date.UTC(now.getUTCFullYear(), 0);
  return (((hours - 24) * 3600) + (yearStart / 1000)) | 0;
};
