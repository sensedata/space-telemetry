import _ from "lodash";
import LimitedStore from "./limited_store.js";


class SimpleStore extends LimitedStore {

  constructor(action, props) {
    super(props);

    this.register(action, this.update.bind(this));
  }

  update(data) {
    super.update(_.sortBy(this.state.data.concat(data), "t"));
  }
}

export {SimpleStore as default};
