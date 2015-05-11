import THREE from "three";
import EventEmitter from "events";

import App from "../app.js";

class QuaternionStore extends EventEmitter {

  constructor(props) {
    super(props);

    this.props = props;
    this.quaternion = new THREE.Quaternion();
    this.euler = [new THREE.Euler()];

    this.dispatchToken = props.dispatcher.register(this.dispatch.bind(this));
  }

  update(axis, data) {
    this.quaternion[axis] = data.sort((a, b) => {return b.t - a.t;})[0].v;
    this.euler[0].setFromQuaternion(this.quaternion);

    this.emit(App.TELEMETRY_EVENT);
  }

  dispatch(payload) {
    if (payload.actionType === "new-data") {
      // this.props.dispatcher.waitFor([this.dispatchToken]);

      switch (payload.telemetryNumber) {
        case this.props.axialNumbers.x: this.update("x", payload.data); break;
        case this.props.axialNumbers.y: this.update("y", payload.data); break;
        case this.props.axialNumbers.z: this.update("z", payload.data); break;
        case this.props.axialNumbers.w: this.update("w", payload.data); break;
      }
    }
  }

  get() {
    return this.euler;
  }
}

export {QuaternionStore as default};
