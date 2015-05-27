import React from "react";


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

  storeChanged() {
    this.setState({
      data: this.props.store.get()
    });
  }
}

export {ListeningView as default};
