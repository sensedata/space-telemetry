import _ from "lodash";
import Flux from "flux";
import IO from "io";
import React from "react";

// import BulletChart from "./views/bullet_chart";
import Readout from "./views/readout.jsx";
import SparklineChart from "./views/sparkline_chart.jsx";
import Telemetry from "./stores/telemetry.js";
import TelemetryIndex from "./stores/telemetry_index.js";

class App {
  constructor() {
    this.dispatcher = new Flux.Dispatcher();
    this.socket = IO();
    this.telemetry = new Telemetry({dispatcher: this.dispatcher});
  }

  render() {
    const views = {
      // "bullet-chart": BulletChart,
      "readout": Readout,
      "sparkline-chart": SparklineChart
    };

    _.forEach(views, (view, className) => {
      _.forEach(document.getElementsByClassName(className), e => {
        const telemetryId = e.dataset.telemetryId;
        if (!telemetryId) {return;}

        const telemetryNumber = TelemetryIndex.number(telemetryId);
        const props = {
          store: this.telemetry.getStore(telemetryNumber),
          target: e
        };

        React.render(React.createFactory(view)(props), e);
      });
    });
  }
}

export default new App();
