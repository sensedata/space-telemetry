import {Store} from "flummox";

class LimitedStore extends Store {

  constructor(props) {
    super();

    this.props = props || {};
    this.props.maxSize = this.props.maxSize || 1;
    this.state = {data: []};
  }

  get() {
    return this.state.data;
  }

  maxSize() {
    return this.props.maxSize;
  }

  prune(arr) {
    if (arr.length <= this.maxSize()) {
      return arr;
    }

    return arr.slice(arr.length - this.maxSize());
  }

  update(data) {
    this.setState({data: this.prune(data)});
  }
}

export {LimitedStore as default};
