import Moment from "moment";
import "moment-duration-format";
import React from "react";

import ListeningView from "../listening_view.js";

class TransmissionDelayReadout extends ListeningView {
  componentDidMount() {
    super.componentDidMount();

    window.setInterval(() => {this.forceUpdate();}, 1000);
  }

  render() {
    if (!this.state.data || this.state.data.length <= 0) {
      return <span className="time-alarm">-</span>;
    }
    const time = Moment.unix(this.state.data[0].t).utc();
    const now = Moment().utc();
    const delta = now.diff(time, "milliseconds");
    const rangeAlarm = Math.abs(delta) > 30000;
    const formatted = Moment.duration(delta, "milliseconds").format("HH:mm:ss", { trim: false });

    return <span className={rangeAlarm ? "time-alarm" : ""}>{formatted}</span>;
  }
}

export {TransmissionDelayReadout as default};
