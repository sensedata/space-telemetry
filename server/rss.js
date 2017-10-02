var RSS = require("rss");
var db = require("./db");
var rssCache = require("./rss-cache");

function getCacheValue(cache, key) {
  var retval;
  var obj = cache[key];
  if (obj) {
    retval = obj.cv || obj.v;
  } else {
    retval = null;
  }
  return retval;
}

var VALUES = {
  "297": {
    0: "Disconnected",
    1: "Connected"
  },
  "NODE3000006": {
    1: "Stop",
    2: "Shutdown",
    3: "Standby",
    4: "Process",
    5: "Hot Service",
    6: "Flush",
    7: "Warm Shutdown"
  },
  "NODE3000007": {
    0: "None",
    1: "Vent",
    2: "Heatup",
    3: "Purge",
    4: "Flow",
    5: "Test",
    6: "Test SV 1",
    7: "Test SV 2",
    8: "Service"
  }
};

exports.getRss = function getRss() {
  var now = new Date();
  var feed = new RSS({
    title: "ISS Telemetry",
    description: "ISS Telemetry",
    feed_url: "http://www.telemetry.space/rss.xml",
    site_url: "http://www.telemetry.space",
    language: "en",
    pubDate: now.toUTCString(),
    ttl: "1"
  });

  var cache = rssCache.get();
  // console.log("CACHE", cache);
  var TWONINESEVEN =  getCacheValue(cache, "297");
  var NODE3000006 =  getCacheValue(cache, "NODE3000006");
  var NODE3000007 =  getCacheValue(cache, "NODE3000007");
  var NODE3000008 =  getCacheValue(cache, "NODE3000008");
  var NODE3000009 =  getCacheValue(cache, "NODE3000009");
  var USLAB000058 =  getCacheValue(cache, "USLAB000058");
  var USLAB000059 =  getCacheValue(cache, "USLAB000059");

  var S4000002 = parseFloat(getCacheValue(cache, "S4000002"));
  var S6000005 = parseFloat(getCacheValue(cache, "S6000005"));
  var P4000002 = parseFloat(getCacheValue(cache, "P4000002"));
  var P6000005 = parseFloat(getCacheValue(cache, "P6000005"));
  var S4000005 = parseFloat(getCacheValue(cache, "S4000005"));
  var S6000002 = parseFloat(getCacheValue(cache, "S6000002"));
  var P4000005 = parseFloat(getCacheValue(cache, "P4000005"));
  var P6000002 = parseFloat(getCacheValue(cache, "P6000002"));

  var currentAll = (S4000002 + S6000005 + P4000002 + P6000005 + S4000005 + S6000002 + P4000005 + P6000002);

  var S4000001 = parseFloat(getCacheValue(cache, "S4000001"));
  var S6000004 = parseFloat(getCacheValue(cache, "S6000004"));
  var P4000001 = parseFloat(getCacheValue(cache, "P4000001"));
  var P6000004 = parseFloat(getCacheValue(cache, "P6000004"));
  var S4000004 = parseFloat(getCacheValue(cache, "S4000004"));
  var S6000001 = parseFloat(getCacheValue(cache, "S6000001"));
  var P4000004 = parseFloat(getCacheValue(cache, "P4000004"));
  var P6000001 = parseFloat(getCacheValue(cache, "P6000001"));

  var voltageAll = (S4000001 + S6000004 + P4000001 + P6000004 + S4000004 + S6000001 + P4000004 + P6000001);

  var description = "\nSTATUS: " + VALUES["297"][TWONINESEVEN] + "\n";
  description += "Water Processor State: " + NODE3000006 + "\n";
  description += "Water Processor Step: " + NODE3000007 + "\n";
  description += "Waste Water %: " + NODE3000008 + "\n";
  description += "Clean Water %: " + NODE3000009 + "\n";
  description += "Air Pressure: " + USLAB000058 + "\n";
  description += "Air Temperature: " + USLAB000059 + "\n";
  description += "Current: " + currentAll + "\n";
  description += "Voltage: " + voltageAll + "\n";

  feed.item({
    title: "ISS Telemetry",
    description: description,
    url: "http://www.telemetry.space/",
    pubDate: now.toUTCString(),
    guid: now.getTime()
  });

  return feed.xml();
};

// S4000002,S6000005,P4000002,P6000005,S4000005,S6000002,P4000005,P6000002 - current all
// S4000001,S6000004,P4000001,P6000004,S4000004,S6000001,P4000004,P6000001 - volt all
//
// b) status telemtry (connected / offline)
// c) delay temetry (hh:mm:ss)
// e) mean air pressure inside ISS
// i) Photovoltaic  in Ampere
// j) Photovoltaic  in Volt
// k) mean temperature (°C) inside ISS
//
//
// a) mission day (in days)
// d) mean temperature (°C) outside ISS
// l) speed (over groud / km/h)
// m) height over ground (km)