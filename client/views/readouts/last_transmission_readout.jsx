import _ from "lodash";
import Moment from "moment";
import React from "react";

import ListeningView from "../listening_view.js";

class LastTransmissionReadout extends ListeningView {
  render() {
    const unixTime = this.state.data ? _.max(this.state.data, "t").t : 0;
    const formatted = unixTime === 0 ? "-" : Moment.unix(unixTime).utc().format("HH:mm:ss YYYY.MM.DD");

    return <span>{formatted}</span>;
  }
}

export {LastTransmissionReadout as default};
