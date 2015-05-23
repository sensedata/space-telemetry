import React from "react";

import Telemetry from "../telemetry.js";

class ListeningView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {data: props.store.get()};
  }

  componentDidMount() {
    this.props.store.addListener(
      "change", this.storeChanged.bind(this)
    );
  }

  componentWillUnmount() {
    this.props.store.removeListener(
      "change", this.storeChanged.bind(this)
    );
  }

  storeChanged() {
    this.setState({
      data: this.props.store.get()
    });
  }

  render() {
    if (this.props.target && this.props.target.offsetParent === null) {return false;}
    if (!this.state) {return false;}
    return this.renderWithState();
  }
}

export {ListeningView as default};
