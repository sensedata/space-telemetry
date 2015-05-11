import React from "react";

import App from "../app.js";

class ListeningView extends React.Component {
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
      data: this.props.store.get()
    });
  }

  render() {
    if (!this.state) {return false;}
    return this.renderWithState();
  }
}

export {ListeningView as default};
