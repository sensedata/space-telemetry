import $ from "jquery";
import Flux from "flux";
import IO from "io";
import React from "react";

// import BulletChart from "./views/bullet_chart";
// import Readout from "./views/readout";
import SparklineChart from "./views/sparkline_chart.jsx";
import Telemetry from "./stores/telemetry.js";
import TelemetryIndex from "./stores/telemetry_index.js";

class App {
  constructor() {
    this.dispatcher = new Flux.Dispatcher();
    this.telemetry = new Telemetry({dispatcher: this.dispatcher});
    this.index = new TelemetryIndex();
    this.listening = {};
  }

  render() {
    this.socket = IO();

    $(".microchart, .readout").each((i, e) => {
      const je = $(e);

      const telemetryKey = je.data("telemetryKey");
      if (!telemetryKey) {return;}

      const telemetrySymbol = this.index.symbol(telemetryKey);
      if (!this.listening[telemetrySymbol]) {
        this.socket.on(this.index.num(telemetryKey), data => {
          this.dispatcher.dispatch({
            actionType: "new-data",
            telemetrySymbol: telemetrySymbol,
            data: data
          });
        });
        this.socket.emit(this.index.num(telemetryKey), 1000000000, 100);
        this.listening[telemetrySymbol] = true;
      }

      const props = {
        store: this.telemetry.get(telemetrySymbol),
        target: je
      };

      let view;
      if (je.hasClass("bullet-chart")) {
        // view = BulletChart;

      } else if (je.hasClass("readout")) {
        // view = Readout;

      } else if (je.hasClass("sparkline-chart")) {
        console.log("sparkline", je);
        view = SparklineChart;
      }

      if (typeof view === "undefined") {
        console.log("Unrecognized", je);

      } else {

        React.render(React.createFactory(view)(props), e);
      }
    });
  }
}

export {App as default};
