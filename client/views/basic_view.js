import React from "react";

import App from "../app.js";

class BasicView extends React.Component {
  componentDidMount() {
    this.props.store.addListener(
      App.TELEMETRY_EVENT, this.storeChanged.bind(this)
    );
  }

  componentWillUnmount() {
    this.props.store.removeListener(
      App.TELEMETRY_EVENT, this.storeChanged.bind(this)
    );
  }

  storeChanged() {
    this.setState({
      data: this.props.store.get(this.availablePoints(), this.earliestAcceptable())
    });
  }

  render() {
    if (!this.state) {return false;}
    return this.renderWithState();
  }

}

export {BasicView as default};
