import Moment from "moment";
import React from "react";


class LocalTimeReadout extends React.Component {
  componentDidMount() {
    window.setInterval(() => {this.setState({moment: Moment().utc()});}, 1000);
  }

  render() {
    if (!this.state) {
      return false;
    }

    return (
      <span>{this.state.moment.format("HH:mm:ss YYYY.MM.DD")}</span>
    );
  }
}

export {LocalTimeReadout as default};
