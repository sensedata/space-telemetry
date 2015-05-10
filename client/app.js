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
        const props = {
          target: e
        };

        if (typeof e.dataset.quaternionId !== "undefined") {
          props.store = this.telemetry.getQStore(
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
          props.store = this.telemetry.getStore(props.telemetryNumber);
        }

        React.render(React.createFactory(view)(props), e);
      });
    });
  }
}

export default new App();
