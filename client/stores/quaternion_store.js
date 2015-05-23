import _ from "lodash";
import THREE from "three";
import {Store} from "flummox";

class QuaternionStore extends Store {

  constructor(props) {
    super();

    this.props = props;
    this.euler = new THREE.Euler();
    this.quaternion=  new THREE.Quaternion();

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
    this.eauler.setFromQuaternion(this.quaternion);

    this.setState({latest: latest});
  }

  get() {
    return [this.euler];
  }
}

export {QuaternionStore as default};
