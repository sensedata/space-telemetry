import _ from "lodash";
import Flux from "flux";
import IO from "io";
import React from "react";

import TelemetryIndex from "./telemetry_index.js";

// import BulletChart from "./views/bullet_chart";
import Readout from "./views/readout.jsx";
import SparklineChart from "./views/sparkline_chart.jsx";

import QuaternionStore from "./stores/quaternion_store.js";
import TelemetryStore from "./stores/telemetry_store.js";

class App {
  constructor() {
    this.dispatcher = new Flux.Dispatcher();
    this.socket = IO();

    this.listeners = [];
    this.stores = [];
    this.qStores = {};
  }

  createQStore(quaternionId, axialNumbers) {
    const qStore = new QuaternionStore({
      dispatcher: this.dispatcher,
      axialNumbers: axialNumbers
    });

    this.qStores[quaternionId] = qStore;
    return qStore;
  }

  createStore(telemetryNumber) {
    const store = new TelemetryStore({
      telemetryNumber: telemetryNumber,
      dispatcher: this.dispatcher
    });

    this.stores[telemetryNumber] = store;
    return store;
  }

  listenToServer(telemetryNumber) {
    this.listeners[telemetryNumber] = this.socket.on(telemetryNumber, data => {
      this.dispatcher.dispatch({
        actionType: "new-data",
        telemetryNumber: telemetryNumber,
        data: data
      });
    });
    this.socket.emit(telemetryNumber, 1000000000, 100);
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

  getQStore(quaternionId, axialNumbers) {
    let qStore;

    qStore = this.qStores[quaternionId];
    if (typeof qStore === "undefined") {
      qStore = this.createQStore(quaternionId, axialNumbers);
    }

    for (let a in axialNumbers) {
      if (!this.listeners[axialNumbers[a]]) {
        this.listenToServer(axialNumbers[a]);
      }
    }

    return qStore;
  }

  render() {
    const views = {
      // "bullet-chart": BulletChart,
      "readout": Readout,
      "sparkline-chart": SparklineChart
    };

    _.forEach(views, (view, className) => {
      _.forEach(document.getElementsByClassName(className), e => {
        const props = {
          target: e
        };

        if (typeof e.dataset.quaternionId !== "undefined") {
          props.store = this.getQStore(
            e.dataset.quaternionId,
            {
              x: TelemetryIndex.number(e.dataset.telemetryIdX),
              y: TelemetryIndex.number(e.dataset.telemetryIdY),
              z: TelemetryIndex.number(e.dataset.telemetryIdZ),
              w: TelemetryIndex.number(e.dataset.telemetryIdW)
            }
          );

        } else {
          props.telemetryNumber = TelemetryIndex.number(e.dataset.telemetryId);
          props.store = this.getStore(props.telemetryNumber);
        }

        React.render(React.createFactory(view)(props), e);
      });
    });
  }
}

App.TELEMETRY_EVENT = Symbol("App.TELEMETRY_EVENT");

export {App as default};
