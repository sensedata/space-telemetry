import THREE from "three";
import EventEmitter from "events";

import Telemetry from "./telemetry.js";

class QuaternionStore extends EventEmitter {

  constructor(props) {
    super(props);

    this.props = props;
    this.quaternion = new THREE.Quaternion();
    this.euler = new THREE.Euler();

    Object.keys(this.props.storesByAxis).forEach(a => {
      this.props.storesByAxis[a].addListener(
        Telemetry.CHANGE_EVENT_KEY, () => {this.update(a);}
      );
    });
  }

  update(axis) {
    this.quaternion[axis] = this.props.storesByAxis[axis].get(1, 0)[0].v;
    this.euler.setFromQuaternion(this.quaternion);

    this.emit(Telemetry.CHANGE_EVENT_KEY);
  }

  get() {
    return [this.euler];
  }
}

export {QuaternionStore as default};
