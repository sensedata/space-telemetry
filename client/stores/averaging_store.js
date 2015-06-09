import _ from "lodash";
import {Store} from "flummox";

class AveragingStore extends Store {

  constructor(actions) {
    super();

    this.latest = {};
    this.state = {data: [{k: [], v: 0}]};

    actions.forEach(a => {
      this.register(a, this.update.bind(this));
    });
  }

  get() {
    return this.state.data;
  }

  update(data) {
    if (data.length <= 0) {
      return;
    }

    const sorted = _.sortBy(data, "t");
    const averages = _.map(sorted, d => {
      let n = 0, sm = 0, sv = 0, t = 0;
      let keys = [];

      this.latest[d.k] = d;
      for (let k in this.latest) {
        n++;
        sm += this.latest[k].vm;
        // TODO This should be a weighted average, not simple.
        sv += this.latest[k].v;
        t = this.latest[k].t > t ? this.latest[k].t : t;
        keys.push(parseInt(k));
      }

      return {k: keys, v: sv / n, vm: sm / n, t: t};
    });

    this.setState({data: averages});
  }
}

export {AveragingStore as default};
