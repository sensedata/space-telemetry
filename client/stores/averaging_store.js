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

    this.latest[data[0].k] = _.max(data, "t");
    const averager = (newState, newData, i) => {
      if (!_.includes(newState.k, newData.k)) {
        newState.k.push(newData.k);
      }
      newState.v = newState.v + (newData.v - newState.v) / i;
      return newState;
    };

    this.setState(_.reduce(this.latest, averager, {k: [], v: 0}));
  }
}

export {AveragingStore as default};
