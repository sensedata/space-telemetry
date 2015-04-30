import _ from "lodash";
import Moment from "moment";
import React from "react";

import BasicView from "./basic_view.js";
import StatusIndex from "../stores/status_index.js";

class Readout extends BasicView {

  formatDecimal(raw) {
    let formatted = raw.toFixed(this.props.target.dataset.scale);
    if (this.props.target.dataset.zeroPad === "true") {
      formatted = _.leftPad(formatted, this.props.target.dataset.precision, "0");
    }
    return formatted;
  }

  formatText(textKey) {
    const values = StatusIndex.get(this.props.telemetryNum);
    let value;
    if (values) {value = values[textKey];}

    return typeof value === "undefined" ? "Unknown" : value;
  }

  formatTimestamp(unixTime) {
    return unixTime === 0 ? "-" : Moment.unix(unixTime).utc().format("HH:mm:ss YYYY.MM.DD");
  }

  renderWithState() {
    const datum = this.state.data[0];

    let value;
    if (this.props.target.classList.contains("text")) {
      value = this.formatText(datum.v);

    } else if (this.props.target.classList.contains("timestamp")) {
      value = this.formatTimestamp(datum.v);

    } else if (this.props.target.classList.contains("decimal")) {
      value = this.formatDecimal(datum.v);
    }

    return <span>{value}</span>;
  }
}

export {Readout as default};
