import _ from "lodash";
import Flummox from "flummox";
import IO from "socket.io-client";

import TelemetryIndex from "./telemetry_index.js";

import AveragingStore from "./stores/averaging_store.js";
import LatestStore from "./stores/latest_store.js";
import QuaternionStore from "./stores/quaternion_store.js";
import SimpleStore from "./stores/simple_store.js";
import SummingStore from "./stores/summing_store.js";
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

  getAveragingStore(telemetryIds) {
    const key = "average" + telemetryIds.sort().join();
    let store = this.getStore(key);
    if (typeof store === "undefined") {
      const actions = telemetryIds.map(i => {
        this.listenToServer(i, 150);
        return this.storeAction(i);
      });
      store = this.createStore(key, AveragingStore, actions);
    }

    return store;
  }

  getSimpleStore(telemetryId) {
    let store = this.getStore(telemetryId);
    if (typeof store === "undefined") {
      this.listenToServer(telemetryId, 150);
      store = this.createStore(
        telemetryId, SimpleStore, this.storeAction(telemetryId), {maxSize: 150}
      );
    }

    return store;
  }

  getSummingStore(telemetryIds) {
    const key = "sum" + telemetryIds.sort().join();
    let store = this.getStore(key);
    if (typeof store === "undefined") {
      const actions = telemetryIds.map(i => {
        this.listenToServer(i, 150);
        return this.storeAction(i);
      });
      store = this.createStore(key, SummingStore, actions);
    }

    return store;
  }

  getQuaternionStore(quaternionId, axialTelemetryIds) {
    let store = this.getStore(quaternionId);
    if (typeof store === "undefined") {
      _.values(axialTelemetryIds).forEach(id => {this.listenToServer(id);});
      store = this.createStore(quaternionId, QuaternionStore, {
        axialActions: {
          x: this.getActions(axialTelemetryIds.x).relay,
          y: this.getActions(axialTelemetryIds.y).relay,
          z: this.getActions(axialTelemetryIds.z).relay,
          w: this.getActions(axialTelemetryIds.w).relay
        }
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

      const timeLimit = preload ? preload * 3 : null;
      this.socket.emit(telemetryNumber, timeLimit, preload || -1);
    }
  }
}

export {App as default};
