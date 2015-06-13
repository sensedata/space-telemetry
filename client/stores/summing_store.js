import _ from "lodash";
import {Store} from "flummox";

class SummingStore extends Store {

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

    const sums = _.map(_.sortBy(data, "t"), d => {
      let svm = 0, sv = 0;
      let keys = [];

      if (!this.latest[d.k] || d.t >= this.latest[d.k].t) {
        this.latest[d.k] = d;
      }

      for (let k in this.latest) {
        svm += this.latest[k].vm;
        sv += this.latest[k].v;
        keys.push(parseInt(k));
      }

      return {k: keys, v: sv, vm: svm, t: d.t};
    });

    this.setState({data: _.sortBy(sums, "t")});
  }
}

export {SummingStore as default};
