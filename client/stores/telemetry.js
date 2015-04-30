import App from "../app.js";
import TelemetryStore from "./telemetry_store.js";

class Telemetry {
  constructor(props) {
    this.props = props;
    this.stores = [];
    this.listeners = [];
  }

  createStore(telemetryNumber) {
    const store = new TelemetryStore({
      telemetryNumber: telemetryNumber,
      dispatcher: this.props.dispatcher
    });

    this.stores[telemetryNumber] = store;
    return store;
  }

  listenToServer(telemetryNumber) {
    this.listeners[telemetryNumber] = App.socket.on(telemetryNumber, data => {
      App.dispatcher.dispatch({
        actionType: "new-data",
        telemetryNumber: telemetryNumber,
        data: data
      });
    });
    App.socket.emit(telemetryNumber, 1000000000, 100);
  }

  getStore(telemetryNumber) {
    let store = this.stores[telemetryNumber];
    if (typeof store === "undefined") {
      store = this.createStore(telemetryNumber);
    }

    if (!this.listeners[telemetryNumber]) {
      this.listenToServer(telemetryNumber);
    }

    return store;
  }
}

export {Telemetry as default};
