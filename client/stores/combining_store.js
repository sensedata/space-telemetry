import _ from "lodash";
import LimitedStore from "./limited_store.js";

class CombiningStore extends LimitedStore {

  constructor(actions, props) {
    super(props);

    this.telemetry = {};
    this.telemetryTimes = [];
    this.state = {data: [{k: [], v: 0, vm: 0, t: 0}]};

    actions.forEach(a => {
      this.register(a, this.update.bind(this));
    });
  }

  get() {
    return this.state.data;
  }

  update(data, callback) {
    if (data.length <= 0) {
      return;
    }

    data.forEach(d => {
      if (typeof this.telemetry[d.k] === "undefined") {
        this.telemetry[d.k] = [];
      }

      this.telemetry[d.k].push(d);
      this.telemetryTimes.push(d.t);
    });

    for (const k in this.telemetry) {
      this.telemetry[k] = this.prune(_.sortBy(this.telemetry[k], "t"));
    }
    this.telemetryTimes = this.prune(_.uniq(this.telemetryTimes.sort()));

    const combined = this.telemetryTimes.map(t => {
      const result = {keys: [], n: 0, sv: 0, svm: 0, t: t};

      for (const k in this.telemetry) {
        const latest = _.findLast(this.telemetry[k], d => {return d.t <= t;});
        if (typeof latest === "undefined") {
          continue;
        }

        result.n++;
        result.sv += latest.v;
        result.svm += latest.vm;
        result.keys.push(parseInt(k));
      }

      return callback(result);
    });

    super.update(combined);
  }
}

export {CombiningStore as default};
