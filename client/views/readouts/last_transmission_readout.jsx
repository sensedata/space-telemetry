import _ from "lodash";
import Moment from "moment";
import React from "react";

import ListeningView from "../listening_view.js";

class LastTransmissionReadout extends ListeningView {
  render() {
    const data = null;
    let unixLast = 0;
    if (!_.isEmpty(this.state.data)) {
      unixLast = _.max(this.state.data, "t").t;
    }
    let formatted;
    if (unixLast > 0) {
      formatted = Moment.unix(unixLast).utc().format("HH:mm:ss YYYY.MM.DD");
    } else {
      formatted = "-";
    }

    return <span>{formatted}</span>;
  }
}

export {LastTransmissionReadout as default};
