import TelemetryIndex from "../telemetry_index";

const gpsStatuses = {
  0: "Doing position fixes",
  1: "SV timing",
  2: "Approximate timing",
  3: "GPS time",
  4: "Need initialization",
  5: "GDOP needed",
  6: "Bad timing",
  7: "No usable satellite",
  8: "Track 1 satellite",
  9: "Track 2 satellite",
  10: "Track 3 satellite",
  11: "Bad integrity",
  12: "No vel available",
  13: "Unusable fix"
};

const airConditionerStatuses = {
  0: "Reset",
  1: "Drain",
  2: "Dryout",
  3: "EIB Off",
  4: "Off",
  5: "On",
  6: "Startup",
  7: "Test"
};

const statusById = {
  "NODE2000003": airConditionerStatuses,
  "NODE3000004": {
    2: "Stop",
    4: "Shutdown",
    8: "Maintenance",
    16: "Normal",
    32: "Standby",
    64: "Idle",
    128: "System Initialized"
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
  },

  "NODE3000010": {
    1: "Process",
    2: "Standby",
    3: "Shutdown",
    4: "Stop",
    5: "Vent Dome",
    6: "Inert Dome",
    7: "Fast Shutdown",
    8: "N2 Purge Shutdown"
  },
  "NODE3000018": airConditionerStatuses,
  "STATUS": {
    0: "Disconnected",
    1: "Connected"
  },
  "USLAB000012": {
    0: "Default",
    1: "Wait",
    2: "Reserved",
    3: "Standby",
    4: "CMG attitude control",
    5: "CMG thruster assist",
    6: "User data generation",
    7: "Free drift"
  },
  "USLAB000013": {
    0: "None",
    1: "GPS 1",
    2: "GPS 2",
    3: "Russian",
    4: "Ku band"
  },
  "USLAB000014": {
    0: "None",
    1: "RGA 1",
    2: "RGA 2",
    3: "Russian"
  },
  "USLAB000016": {
    0: "Attitude hold",
    1: "Momentum management"
  },
  "USLAB000017": {
    0: "LVLH",
    1: "J2000",
    2: "XPOP"
  },
  "USLAB000043": gpsStatuses,
  "USLAB000044": gpsStatuses,
  "USLAB000064": airConditionerStatuses,
  "USLAB000065": airConditionerStatuses,
  "USLAB000086": {
    1: "Standard",
    2: "Microgravity",
    4: "Reboost",
    8: "Proximity Ops",
    16: "External Ops",
    32: "Survival",
    64: "Assured Safe Crew Return"
  }
};

const statuses = {};
for (let id in statusById) {
  statuses[TelemetryIndex.number(id)] = statusById[id];
}

class StatusDictionary {
  static get(telemetryNumber) {
    return statuses[telemetryNumber];
  }
}

export {StatusDictionary as default};
