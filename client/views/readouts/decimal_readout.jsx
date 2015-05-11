import _ from "lodash";
import React from "react";

import ListeningView from "../listening_view.js";

class DecimalReadout extends ListeningView {
  renderWithState() {
    let formatted;

    if (this.state.data.length <= 0) {
      formatted = "-";

    } else {
      const current = this.state.data[0];

      let datum;
      if (typeof this.props.target.dataset.quaternionId !== "undefined") {
        datum = current[this.props.target.dataset.eulerAxis];

      } else {
        datum = current.v;
      }

      formatted = datum.toFixed(this.props.target.dataset.scale);
      if (this.props.target.dataset.zeroPad === "true") {
        formatted = _.leftPad(formatted, this.props.target.dataset.precision, "0");
      }
    }

    return <span>{formatted}</span>;
  }
}

export {DecimalReadout as default};
