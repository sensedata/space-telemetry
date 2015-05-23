import Crossfilter from "crossfilter";
import EventEmitter from "events";

import Telemetry from "../telemetry.js";

class TelemetryStore extends EventEmitter {

  constructor(props) {
    super(props);

    this.props = props;
    this.size = 0;

    this.telemetry = Crossfilter();
    this.indexDimension = this.telemetry.dimension(d => {return d.i;});
    this.timeDimension = this.telemetry.dimension(d => {return d.t;});

    this.dispatchToken = props.dispatcher.register(this.dispatch.bind(this));
  }

  add(data, emit = true) {
    const indexed = data.map(d => {return Object.assign({i: this.size++}, d);});
    this.telemetry.add(indexed);
    // FIXME Pruning the wrong stuff.
    // this.prune(false);

    if (emit) {this.emit(Telemetry.NEW);}
  }

  dispatch(payload) {
    if (payload.telemetryNumber === this.props.telemetryNumber && payload.actionType === "new-data") {
      // this.props.dispatcher.waitFor([this.dispatchToken]);
      this.add(payload.data);
    }
  }

  get(maxPoints, earliestTime) {
    if (typeof earliestTime !== "undefined") {
      this.timeDimension.filter(t => {return t >= earliestTime;});
    }
    const top = this.timeDimension.top(maxPoints || 1);

    this.timeDimension.filterAll();
    return top;
  }

  prune(emit = true) {
    this.indexDimension.filter(i => {return i < this.size - this.props.maxSize;});
    this.indexDimension.remove();
    this.indexDimension.filterAll();

    if (emit) {this.emit(Telemetry.NEW);}
  }
}

export {TelemetryStore as default};
