import _ from "lodash";
import Flummox from "flummox";
import IO from "socket.io-client";

import TelemetryIndex from "./telemetry_index.js";

import HistoricalStore from "./stores/historical_store.js";
import LatestStore from "./stores/latest_store.js";
import QuaternionStore from "./stores/quaternion_store.js";

import TelemetryActions from "./actions/telemetry_actions.js";

class App extends Flummox {
  constructor() {
    super();

    this.socket = IO();

    this.listeners = [];
    this.stores = [];
    this.qStores = {};

    this.createStore("latest", LatestStore);
  }

  storeAction(telemetryId) {
    return this.getActions(telemetryId).relay;
  }

  getHistoricalStore(telemetryId) {
    let store = this.getStore(telemetryId);
    if (typeof store === "undefined") {
      this.listenToServer(telemetryId, 150);
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

  listenToServer(telemetryId, preload) {
    const telemetryNumber = TelemetryIndex.number(telemetryId);

    if (typeof this.listeners[telemetryNumber] === "undefined") {
      const actions = this.createActions(telemetryId, TelemetryActions);
      this.listeners[telemetryNumber] = this.socket.on(telemetryNumber, actions.relay);
      if (telemetryNumber < TelemetryIndex.number("TIME_000001")) {
        this.getStore("latest").register(
          actions.relay, this.getStore("latest").update
        );
      }

      // TODO use a real time limit instead of 0
      this.socket.emit(telemetryNumber, 0, preload || -1);
    }
  }
}

export {App as default};
