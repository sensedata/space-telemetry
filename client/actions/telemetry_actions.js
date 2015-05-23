// According to https://github.com/acdlite/flummox/pull/176, class support will
// likely soon be deprecated.

const TelemetryActions = {
  relay: (telemetry) => {
    return telemetry;
  }
};

export {TelemetryActions as default};
