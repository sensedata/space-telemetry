import _ from "lodash";
import {Store} from "flummox";

class AveragingStore extends Store {

  constructor(actions) {
    super();

    this.latest = {};
    this.state = {k: [], v: 0};

    actions.forEach(a => {
      this.register(a, this.update.bind(this));
    });
  }

  get() {
    return [this.state];
  }

  update(data) {
    if (data.length <= 0) {
      return;
    }

    this.latest[data[0].k] = _.max(data, "t").v;
    let n = 0, s = 0;
    const keys = [];
    for (let k in this.latest) {
      n++;
      s += this.latest[k];
      keys.push(parseInt(k));
    }

    this.setState({k: keys, v: s / n});
  }
}

export {AveragingStore as default};
