import Moment from "moment";
import React from "react";

import ListeningView from "./listening_view.js";

class TransmittedAt extends ListeningView {
  renderWithState() {
    const unixTime = this.state.data ? this.state.data.t : 0;
    const formatted = unixTime === 0 ? "-" : Moment.unix(unixTime).utc().format("HH:mm:ss YYYY.MM.DD");

    return <span>{formatted}</span>;
  }
}

export {TransmittedAt as default};
