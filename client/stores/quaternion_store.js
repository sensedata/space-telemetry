import _ from "lodash";
import THREE from "three";
import {Store} from "flummox";

class QuaternionStore extends Store {

  constructor(props) {
    super();

    this.props = props;
    this.euler = new THREE.Euler();
    this.quaternion = new THREE.Quaternion();
    this.state = {x: null, y: null, z: null};
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
    // See https://space.stackexchange.com/a/22423/18909
    this.euler.setFromQuaternion(this.quaternion.clone().normalize(), "ZYX");

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
