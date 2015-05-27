import React from "react";

import ListeningView from "../listening_view.js";

class IntegerReadout extends ListeningView {
  render() {
    let formatted;

    if (this.state.data.length <= 0) {
      formatted = "-";

    } else {
      formatted = Math.round(this.state.data[0].v);
    }

    return <span>{formatted}</span>;
  }
}

export {IntegerReadout as default};
