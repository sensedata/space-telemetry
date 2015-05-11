import _ from "lodash";
import Moment from "moment";
import React from "react";

import BasicView from "./basic_view.js";
import StatusDictionary from "./status_dictionary.js";

class Readout extends BasicView {

  availablePoints() {
    return 1;
  }

  earliestAcceptable() {
    return 0;
  }

  formatDecimal(raw) {
    let formatted = raw.toFixed(this.props.target.dataset.scale);
    if (this.props.target.dataset.zeroPad === "true") {
      formatted = _.leftPad(formatted, this.props.target.dataset.precision, "0");
    }
    return formatted;
  }

  formatText(textKey) {
    const values = StatusDictionary.get(this.props.telemetryNumber);
    let value;
    if (values) {value = values[textKey];}
    return typeof value === "undefined" ? "Unknown" : value;
  }

  formatTimestamp(unixTime) {
    return unixTime === 0 ? "-" : Moment.unix(unixTime).utc().format("HH:mm:ss YYYY.MM.DD");
  }

  renderWithState() {
    const current = this.state.data[0];

    let datum;
    if (typeof this.props.target.dataset.quaternionId !== "undefined") {
      datum = current[this.props.target.dataset.eulerAxis];

    } else {
      datum = current.v;
    }

    let value;
    if (this.props.target.classList.contains("decimal")) {
      value = this.formatDecimal(datum);

    } else if (this.props.target.classList.contains("integer")) {
      value = Math.round(datum);

    } else if (this.props.target.classList.contains("text")) {
      value = this.formatText(datum);

    } else if (this.props.target.classList.contains("timestamp")) {
      value = this.formatTimestamp(datum);
    }


    return <span>{value}</span>;
  }
}

export {Readout as default};
