import App from "../app.js";
import QuaternionStore from "./quaternion_store.js";
import TelemetryIndex from "./telemetry_index.js";
import TelemetryStore from "./telemetry_store.js";

class Telemetry {
  constructor(props) {
    this.props = props;

    this.listeners = [];
    this.stores = [];
    this.qStores = {};
  }

  createQStore(quaternionId, telemetryByAxis) {
    const storesByAxis = {};
    Object.keys(telemetryByAxis).forEach(
      a => {storesByAxis[a] = this.getStore(telemetryByAxis[a]);}
    );

    const qStore = new QuaternionStore({
      dispatcher: this.props.dispatcher,
      storesByAxis: storesByAxis,
      telemetryByAxis: telemetryByAxis
    });

    this.qStores[quaternionId] = qStore;
    return qStore;
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

  getQStore(quaternionId, telemetryByAxis) {
    let qStore;

    qStore = this.qStores[quaternionId];
    if (typeof qStore === "undefined") {
      qStore = this.createQStore(quaternionId, telemetryByAxis);
    }

    return qStore;
  }
}

Telemetry.CHANGE_EVENT_KEY = Symbol("Telemetry.CHANGE_EVENT_KEY");

export {Telemetry as default};
