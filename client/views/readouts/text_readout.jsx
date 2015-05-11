import React from "react";

import ListeningView from "../listening_view.js";
import StatusDictionary from "../status_dictionary.js";

class TextReadout extends ListeningView {
  renderWithState() {
    const values = StatusDictionary.get(this.props.telemetryNumber);
    let value;
    if (values && this.state.data.length > 0) {
      value = values[this.state.data[0].v];
    }

    return <span>{typeof value === "undefined" ? "Unknown" : value}</span>;
  }
}

export {TextReadout as default};
