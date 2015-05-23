import _ from "lodash";
import {Store} from "flummox";


class SimpleStore extends Store {

  constructor(action, props) {
    super();

    this.props = props;
    this.state = {};

    // TODO Ignore TIME records.
    this.register(action, this.update);
  }

  update(data) {
    const latest = _.max(data, d => {return d.t;});
    if (!this.datum || latest.t > this.datum.t) {
      this.state = latest;
    }
  }

  get() {
    return [this.state];
  }
}

export {SimpleStore as default};
