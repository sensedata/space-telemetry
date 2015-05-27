import _ from "lodash";
import {Store} from "flummox";

class LatestStore extends Store {

  constructor(props) {
    super();

    this.props = props;
  }

  update(data) {
    const latest = _.max(data, "t");
    if (!this.state || latest.t > this.state.t) {
      this.setState(latest);
    }
  }

  get() {
    return this.state ? [this.state] : [];
  }
}

export {LatestStore as default};
