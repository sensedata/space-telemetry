import Crossfilter from "crossfilter";
import EventEmitter from "events";

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
    this.prune(false);

    if (emit) {this.emit(TelemetryStore.CHANGE_EVENT_KEY);}
  }

  dispatch(payload) {
    if (payload.telemetryNum === this.props.telemetryNum && payload.actionType === "new-data") {
      // this.props.dispatcher.waitFor([this.dispatchToken]);
      this.add(payload.data);
    }
  }

  get() {
    return this.timeDimension.top(100);
  }

  prune(emit = true) {
    this.indexDimension.filter(i => {return i < this.size - this.props.maxSize;});
    this.indexDimension.remove();

    if (emit) {this.emit(TelemetryStore.CHANGE_EVENT_KEY);}
  }
}

TelemetryStore.CHANGE_EVENT_KEY = Symbol("TelemetryStore.CHANGE_EVENT_KEY");

export {TelemetryStore as default};
