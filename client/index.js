import _ from "lodash";
import Moment from "moment";
import React from "react";

import App from "./app.js";

import SimpleStore from "./stores/simple_store.js";
import TelemetryIndex from "./telemetry_index.js";

import BulletChart from "./views/bullet_chart.jsx";
import SparklineChart from "./views/sparkline_chart.jsx";

import DecimalReadout from "./views/readouts/decimal_readout.jsx";
import IntegerReadout from "./views/readouts/integer_readout.jsx";
import TextReadout from "./views/readouts/text_readout.jsx";
import TimestampReadout from "./views/readouts/timestamp_readout.jsx";

import TransmittedAt from "./views/transmitted_at.jsx";
import TransmissionDelay from "./views/transmission_delay.jsx";

const app = new App();

const viewFactories = {
  "bullet-chart":  React.createFactory(BulletChart),
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
      height: e.offsetHeight,
      target: e,
      width: e.offsetWidth
    };

    Object.assign(props, e.dataset);

    if (typeof e.dataset.quaternionId !== "undefined") {
      props.store = app.getQuaternionStore(
        e.dataset.quaternionId,
        {
          x: e.dataset.telemetryIdX,
          y: e.dataset.telemetryIdY,
          z: e.dataset.telemetryIdZ,
          w: e.dataset.telemetryIdW
        }
      );

    } else if (typeof e.dataset.telemetryId !== "undefined") {
      props.store = app.getHistoricalStore(e.dataset.telemetryId);
      props.telemetryNumber = TelemetryIndex.number(e.dataset.telemetryId);
    }

    if (typeof e.dataset.capacityId !== "undefined") {
      props.capacityStore = app.getHistoricalStore(e.dataset.capacityId);
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
  app.socket.on(telemetryNumber, data => {
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
  app.socket.emit(telemetryNumber, -1, 1);
});

// const latestProps = {
//   store: new SimpleStore({dispatcher: this.dispatcher})
// };
//
// React.render(
//   React.createFactory(TransmittedAt)(latestProps),
//   document.getElementById("telemetry-transmitted")
// );
//
// const delayView = React.render(
//   React.createFactory(TransmissionDelay)(latestProps),
//   document.getElementById("telemetry-delay")
// );

window.setInterval(() => {
  const now = Moment().unix();

  // delayView.forceUpdate();
  sparkLineCharts.forEach(c => {
    if (now - c.lastUpdate > 1) {
      c.forceUpdate();
    }
  });
}, 1000);
