import EventEmitter from "events";

import App from "../app.js";

class SimpleStore extends EventEmitter {

  constructor(props) {
    super(props);
    this.props = props;
    this.dispatchToken = props.dispatcher.register(this.dispatch.bind(this));
  }

  update(data) {
    const newData = data.sort((a, b) => {return b.t - a.t;})[0];
    if (!this.datum || newData.t > this.datum.t) {
      this.datum = newData;
      this.emit(App.TELEMETRY_EVENT);
    }
  }

  dispatch(payload) {
    if (payload.actionType === "new-data") {
      // this.props.dispatcher.waitFor([this.dispatchToken]);
      this.update(payload.data);
    }
  }

  get() {
    return this.datum;
  }
}

export {SimpleStore as default};
