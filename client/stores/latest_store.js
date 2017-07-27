import _ from "lodash";
import {Store} from "flummox";

const DELAY_ERROR_MARGIN = 60;

class LatestStore extends Store {

  constructor(props) {
    super();

    this.props = props;
  }

  update(data) {
    // Some Lightstreamer data is timestamped far in the future, presumably a
    // bug in their processing or NASA's; this replaces future timestamps.
    const unixNow = Math.round(Date.now() / 1000) + DELAY_ERROR_MARGIN;
    const possible = _.filter(data, (d) => d.t <= unixNow);
    const latest = _.max(possible, "t");
    if (!this.state || latest.t > this.state.t) {
      this.setState(latest);
    }
  }

  get() {
    return this.state ? [this.state] : [];
  }
}

export {LatestStore as default};
