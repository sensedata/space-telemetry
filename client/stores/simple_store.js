import _ from "lodash";
import {Store} from "flummox";

class SimpleStore extends Store {

  constructor(action) {
    super();

    this.state = {data: []};
    this.register(action, this.update.bind(this));
  }

  get() {
    return this.state.data;
  }

  update(data) {
    this.setState({data: _.sortBy(data, "t")});
  }
}

export {SimpleStore as default};
