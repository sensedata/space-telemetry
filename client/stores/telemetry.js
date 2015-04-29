import TelemetryStore from "./telemetry_store.js";

class Telemetry {
  constructor(props) {
    this.props = props;
    this.stores = {};
  }

  get(telemetrySymbol) {
    let store = this.stores[telemetrySymbol];
    if (typeof store === "undefined") {
      store = new TelemetryStore({telemetrySymbol: telemetrySymbol, dispatcher: this.props.dispatcher});
      this.stores[telemetrySymbol] = store;
    }

    return store;
  }
}

export {Telemetry as default};
