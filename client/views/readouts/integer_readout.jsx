import _ from "lodash";
import React from "react";

import ListeningView from "../listening_view.js";

class IntegerReadout extends ListeningView {
  render() {
    let formatted;

    if (this.state.data === null || this.state.data.length <= 0) {
      formatted = "-";

    } else {
      if (this.state.data.length > 1) {
        formatted = _.max(this.state.data, "t").v;

      } else {
        formatted = this.state.data[0].v;
      }

      formatted = Math.round(formatted);
    }

    return <span>{formatted}</span>;
  }
}

export {IntegerReadout as default};
