import _ from "lodash";
import Flummox from "flummox";
import IO from "socket.io-client";

import TelemetryIndex from "./telemetry_index.js";

import QuaternionStore from "./stores/quaternion_store.js";
import HistoricalStore from "./stores/historical_store.js";

import TelemetryActions from "./actions/telemetry_actions.js";

class App extends Flummox {
  constructor() {
    super();

    this.socket = IO();

    this.listeners = [];
    this.stores = [];
    this.qStores = {};
  }

  storeAction(telemetryId) {
    return this.getActions(telemetryId).relay;
  }

  getHistoricalStore(telemetryId) {
    let store = this.getStore(telemetryId);
    if (typeof store === "undefined") {
      this.listenToServer(telemetryId);
      store = this.createStore(telemetryId, HistoricalStore, this.storeAction(telemetryId));
    }

    return store;
  }

  getQuaternionStore(quaternionId, axialTelemetryIds) {
    let store = this.getStore(quaternionId);
    if (typeof store === "undefined") {
      _.values(axialTelemetryIds).forEach(id => {this.listenToServer(id);});
      store = this.createStore(quaternionId, QuaternionStore, this, {
        x: this.getHistoricalStore(axialTelemetryIds.x),
        y: this.getHistoricalStore(axialTelemetryIds.y),
        z: this.getHistoricalStore(axialTelemetryIds.z),
        w: this.getHistoricalStore(axialTelemetryIds.w)
      });
    }

    return store;
  }

  listenToServer(telemetryId) {
    const telemetryNumber = TelemetryIndex.number(telemetryId);

    if (typeof this.listeners[telemetryNumber] === "undefined") {
      const actions = this.createActions(telemetryId, TelemetryActions);
      this.listeners[telemetryNumber] = this.socket.on(telemetryNumber, actions.relay);
    }
  }
}

export {App as default};
