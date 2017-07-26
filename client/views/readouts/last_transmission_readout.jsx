import _ from "lodash";
import Moment from "moment";
import React from "react";

import ListeningView from "../listening_view.js";

class LastTransmissionReadout extends ListeningView {
  render() {
    // Some Lightstreamer data is timestamped far in the future, presumably a
    // bug in their processing or NASA's; this replaces future timestamps.
    const data = null;
    let unixLast = 0;
    if (!_.isEmpty(this.state.data)) {
      const unixNow = Math.round(Date.now() / 1000);
      const possible = _.filter(this.state.data, (d) => d.t <= unixNow);
      unixLast = (possible.length > 0) ? _.max(possible, "t").t : unixNow;
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
