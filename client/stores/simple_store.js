import _ from "lodash";
import {Store} from "flummox";

class SimpleStore extends Store {

  constructor(action, props) {
    super();

    if (!props) {
      props = {maxSize: 1};
    } else if (!props.maxSize) {
      props.maxSize = 1;
    }
    this.props = props;
    this.state = {data: []};
    this.register(action, this.update.bind(this));
  }

  get() {
    return this.state.data;
  }

  update(data) {
    let newData = _.sortBy(this.state.data.concat(data), "t");
    if (newData.length > this.props.maxSize) {
      newData = newData.slice(newData.length - this.props.maxSize);
    }
    this.setState({data: newData});
  }
}

export {SimpleStore as default};
