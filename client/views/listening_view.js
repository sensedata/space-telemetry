import React from "react";


class ListeningView extends React.Component {
  constructor(props) {
    super(props);

    this.state = this.getStoreState();
  }

  componentDidMount() {
    this.props.store.addListener(
      "change", this.storeChanged.bind(this)
    );
  }

  storeChanged() {
    // this.setState(this.getStoreState());
    const data = this.getStoreState().data.slice();
    this.setState({data: data});
  }

  getStoreState() {
    return {data: this.props.store.get()};
  }
}

export {ListeningView as default};
