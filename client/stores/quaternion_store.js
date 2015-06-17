import _ from "lodash";
import THREE from "three";
import {Store} from "flummox";

class QuaternionStore extends Store {

  constructor(props) {
    super();

    this.props = props;
    this.euler = new THREE.Euler();
    this.quaternion = new THREE.Quaternion();

    _.keys(this.props.axialActions).forEach(a => {
      this.register(this.props.axialActions[a], d => {
        this.update(a, d);
      });
    });
  }

  latest(data) {
    return _.max(data, d => {return d.t;});
  }

  update(axis, data) {
    const latest = this.latest(data);

    this.quaternion[axis] = latest.v;
    // Note that THREE.js docs say the quaternion argument here must be
    // normalized; however doing so before using it in setQ results in euler
    // angles that don't come close to matching the output of any quaternion to
    // euler formulae I have found - ylg.
    this.euler.setFromQuaternion(this.quaternion);

    this.setState({
      x: THREE.Math.radToDeg(this.euler.x),
      y: THREE.Math.radToDeg(this.euler.y),
      z: THREE.Math.radToDeg(this.euler.z)
    });
  }

  get() {
    return [this.state];
  }
}

export {QuaternionStore as default};
