import Flummox from "flummox";

import DecimalReadout from "../../client/views/readouts/decimal_readout.jsx";

import SimpleStore from "../../client/stores/simple_store.js";
import TelemetryActions from "../../client/actions/telemetry_actions.js";


class ClientHelper {
  static buildUI(view, props) {
    // React does DOM interaction while it's being loaded, so it and
    // anything that depends on it can't be imported until after the DOM
    // is available, i.e., it is incompatible with ES6 import outside
    // the browser. And, it saves document state after loading, so if document
    // changes, pretty much the whole require cache must be invalidated and reloaded.
    for (var i in require.cache) {delete require.cache[i];}
    const React = require("react");
    // const View = require("../../client/views/" + file);
    // const View = DecimalReadout;
    const app = new Flummox();
    const action = app.createActions("test", TelemetryActions);
    const store = app.createStore("test", SimpleStore, action.relay, {maxSize: 200});
    const viewProps = Object.assign({store: store, target: document.body}, props);
    return {
      action: action,
      app: app,
      React: React,
      props: viewProps,
      view: React.createFactory(view)(viewProps),
      viewClass: view
    };
  }

  static wrap(value) {
    return new RegExp(`<span[^>]*>${value}</span>`);
  }
}

export {ClientHelper as default};
