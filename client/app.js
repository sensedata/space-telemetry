import _ from "lodash";
import Flux from "flux";
import IO from "io";
import React from "react";

import TelemetryIndex from "./telemetry_index.js";

// import BulletChart from "./views/bullet_chart";
import SparklineChart from "./views/sparkline_chart.jsx";

import DecimalReadout from "./views/readouts/decimal_readout.jsx";
import IntegerReadout from "./views/readouts/integer_readout.jsx";
import TextReadout from "./views/readouts/text_readout.jsx";
import TimestampReadout from "./views/readouts/timestamp_readout.jsx";

import TransmittedAt from "./views/transmitted_at.jsx";
import TransmissionDelay from "./views/transmission_delay.jsx";

import QuaternionStore from "./stores/quaternion_store.js";
import SimpleStore from "./stores/simple_store.js";
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
    if (typeof this.listeners[telemetryNumber] === "undefined") {
      this.listeners[telemetryNumber] = this.socket.on(telemetryNumber, data => {
        // Uncomment to watch telemetry delay bug in action
        // const newest = _.max(data, d => {return d.t;});
        // console.log("now, latest record, difference", moment().unix(), newest.t, moment().unix() - newest.t);
        this.dispatcher.dispatch({
          actionType: "new-data",
          telemetryNumber: telemetryNumber,
          data: data
        });
      });
      this.socket.emit(telemetryNumber, 1000000000, 200);
    }
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
      "readout decimal": React.createFactory(DecimalReadout),
      "readout integer": React.createFactory(IntegerReadout),
      "readout text": React.createFactory(TextReadout),
      "readout timestamp": React.createFactory(TimestampReadout),
      "sparkline-chart": React.createFactory(SparklineChart)
    };

    const sparkLineCharts = [];

    _.forEach(viewFactories, (viewFactory, className) => {
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

        } else if (typeof e.dataset.telemetryId !== "undefined") {
          props.telemetryNumber = TelemetryIndex.number(e.dataset.telemetryId);
          props.store = this.getStore(props.telemetryNumber);
        }

        if (typeof props.store !== "undefined") {
          const view = React.render(viewFactory(props), e);
          if (e.classList.contains("sparkline-chart")) {
            sparkLineCharts.push(view);
          }
        }
      });

    });

    _.forEach(document.getElementsByClassName("status"), e => {
      const telemetryNumber = TelemetryIndex.number(e.dataset.telemetryId);
      this.socket.on(telemetryNumber, data => {
        const latest = _.max(data, d => {return d.t;});
        // No shipping version of IE correctly implements toggle.
        if (latest.v === parseFloat(e.dataset.statusOnValue)) {
          e.classList.add("on");
          e.classList.remove("off");
        } else {
          e.classList.remove("on");
          e.classList.add("off");
        }
      });
      this.socket.emit(telemetryNumber, -1, 1);
    });

    const latestProps = {
      store: new SimpleStore({dispatcher: this.dispatcher})
    };

    React.render(
      React.createFactory(TransmittedAt)(latestProps),
      document.getElementById("telemetry-transmitted")
    );

    const delayView = React.render(
      React.createFactory(TransmissionDelay)(latestProps),
      document.getElementById("telemetry-delay")
    );

    window.setInterval(() => {
      const now = Moment().unix();

      delayView.forceUpdate();
      sparkLineCharts.forEach(c => {
        if (now - c.lastUpdate > 1) {
          c.forceUpdate();
        }
      });
    }, 1000);
  }
}

App.TELEMETRY_EVENT = Symbol("App.TELEMETRY_EVENT");

export {App as default};
