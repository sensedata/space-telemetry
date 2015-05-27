import _ from "lodash";
import React from "react";

import ListeningView from "../listening_view.js";

class DecimalReadout extends ListeningView {
  render() {
    let formatted;

    if (this.state.data.length <= 0) {
      formatted = "-";

    } else {
      const current = this.state.data[0];

      if (typeof this.props.target.dataset.quaternionId !== "undefined") {
        formatted = current[this.props.target.dataset.eulerAxis];

      } else {
        formatted = current.v;
      }

      if (typeof this.props.target.dataset.scale !== "undefined") {
        formatted = formatted.toFixed(this.props.target.dataset.scale);

      } else {
        formatted = formatted.toString();
      }

      if (typeof this.props.target.dataset.precision !== "undefined") {
        const integer = parseInt(formatted);
        const padded = _.padLeft(integer, this.props.target.dataset.precision, "0");
        formatted = formatted.replace(new RegExp("^" + integer), padded);
      }
    }

    return <span>{formatted}</span>;
  }
}

export {DecimalReadout as default};
