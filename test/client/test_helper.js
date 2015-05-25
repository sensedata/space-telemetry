import Flummox from "flummox";

import HistoricalStore from "../../client/stores/historical_store.js";
import TelemetryActions from "../../client/actions/telemetry_actions.js";


class TestHelper {
  static buildUI(file, props) {
    // React does DOM interaction while it's being loaded, so it and
    // anything that depends on it can't be imported until after the DOM
    // is available, i.e., it is incompatible with ES6 import outside
    // the browser. And, it saves document state after loading, so if document
    // changes, pretty much the whole require cache must be invalidated and reloaded.
    for (var i in require.cache) {delete require.cache[i];}
    const React = require("react");
    const View = require("../../client/views/" + file);

    const app = new Flummox();
    const action = app.createActions("test", TelemetryActions);
    const store = app.createStore("test", HistoricalStore, action.relay);
    const viewProps = Object.assign({store: store, target: document.body}, props);
    return {
      action: action,
      app: app,
      React: React,
      props: viewProps,
      view: React.createFactory(View)(viewProps),
      viewClass: View
    };
  }

  static wrap(value) {
    return new RegExp(`<span[^>]*>${value}</span>`);
  }
}

export {TestHelper as default};
