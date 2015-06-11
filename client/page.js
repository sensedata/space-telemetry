import _ from "lodash";
import $ from "jquery";
import Moment from "moment";
import React from "react";

import App from "./app.js";

import TelemetryIndex from "./telemetry_index.js";

import BarChart from "./views/charts/bar_chart.jsx";
import BulletChart from "./views/charts/bullet_chart.jsx";
import SparklineChart from "./views/charts/sparkline_chart.jsx";

import DecimalReadout from "./views/readouts/decimal_readout.jsx";
import IntegerReadout from "./views/readouts/integer_readout.jsx";
import LastTransmissionReadout from "./views/readouts/last_transmission_readout.jsx";
import LocalTimeReadout from "./views/readouts/local_time_readout.jsx";
import TextReadout from "./views/readouts/text_readout.jsx";
import TimestampReadout from "./views/readouts/timestamp_readout.jsx";
import TransmissionDelayReadout from "./views/readouts/transmission_delay_readout.jsx";

const app = new App();

const viewFactories = {
  "bar-chart":  React.createFactory(BarChart),
  "bullet-chart":  React.createFactory(BulletChart),
  "readout decimal": React.createFactory(DecimalReadout),
  "readout integer": React.createFactory(IntegerReadout),
  "readout text": React.createFactory(TextReadout),
  "readout timestamp": React.createFactory(TimestampReadout),
  "sparkline-chart": React.createFactory(SparklineChart)
};

const timeSeriesCharts = [];

require("./styles/page.scss");

_.forEach(viewFactories, (viewFactory, className) => {
  _.forEach(document.getElementsByClassName(className), e => {
    const je = $(e);
    const props = {
      height: je.height(),
      target: e,
      width: je.width()
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
      props.store = app.getSimpleStore(e.dataset.telemetryId);
      props.telemetryNumber = TelemetryIndex.number(e.dataset.telemetryId);

    } else if (typeof e.dataset.telemetryIds !== "undefined") {
      props.store = app.getAveragingStore(e.dataset.telemetryIds.split(","))
    }

    if (typeof e.dataset.capacityId !== "undefined") {
      props.capacityStore = app.getSimpleStore(e.dataset.capacityId);
    }

    if (typeof props.store !== "undefined") {
      const view = React.render(viewFactory(props), e);
      if (e.classList.contains("sparkline-chart")) {
        timeSeriesCharts.push(view);
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
  app.socket.emit(telemetryNumber, null, -1);
});

app.socket.on("disconnect", (d) => {
  app.getActions("STATUS").relay([{t: Moment.unix(), v: 0}]);
});

app.socket.on("reconnect", () => {
  app.socket.emit(TelemetryIndex.number("STATUS"), null, -1);
});

React.render(
  React.createFactory(LastTransmissionReadout)({store: app.getStore("latest")}),
  document.getElementById("telemetry-transmitted")
);

React.render(
  React.createFactory(TransmissionDelayReadout)({store: app.getStore("latest")}),
  document.getElementById("telemetry-delay")
);

React.render(
  React.createFactory(LocalTimeReadout)(), document.getElementById("local-time")
);

window.setInterval(() => {
  const now = Moment().unix();

  // delayView.forceUpdate();
  timeSeriesCharts.forEach(c => {
    if (now - c.lastUpdate > 1) {
      c.forceUpdate();
    }
  });
}, 1000);
