import _ from "lodash";
import Chai from "chai";
import Flummox from "flummox";
import jsdom from "jsdom";

import HistoricalStore from "../../../../client/stores/historical_store.js";
import StatusDictionary from "../../../../client/views/status_dictionary.js";
import TelemetryActions from "../../../../client/actions/telemetry_actions.js";
import TelemetryIndex from "../../../../client/telemetry_index.js";

const assert = Chai.assert;

describe("TextReadout", () => {
  let React;

  let action;
  let factory;
  let store;

  const telemetryNumber = TelemetryIndex.number("USLAB000086");
  const payload = [{t: 0, v: 4}];

  beforeEach((done) => {
    jsdom.env("<!doctype html><html><body></body></html>", (e, window) => {
      Object.assign(global, _.pick(window, "document", "navigator"));
      global.window = window;
      window.console = global.console;

      // React does DOM interaction while it's being loaded, so it and
      // anything that depends on it can't be imported until after the DOM
      // is available, i.e., it is incompatible with ES6 import outside
      // the browser.
      React = require("react");
      const TextReadout = require(
        "../../../../client/views/readouts/text_readout.jsx"
      );

      const app = new Flummox();

      action = app.createActions("test", TelemetryActions);
      store = app.createStore("test", HistoricalStore, action.relay);
      factory = React.createFactory(TextReadout)({store: store, telemetryNumber: telemetryNumber});

      done();
    });
  });

  const wrapped = (value) => {
    return new RegExp(`<span[^>]*>${value}</span>`);
  };

  const translated = (value) => {
    return wrapped(StatusDictionary.get(telemetryNumber)[value]);
  };

  it("renders data received before mounting", () => {
    action.relay(payload);
    React.render(factory, document.body);

    assert.match(document.body.innerHTML, translated(payload[0].v));
  });

  it("renders data received after mounting", () => {
    React.render(factory, document.body);
    action.relay(payload);

    assert.match(document.body.innerHTML, translated(payload[0].v));
  });

  it("renders 'Unknown' for a unmappable value", () => {
    React.render(factory, document.body);
    action.relay([{t: 0, v: -1}]);

    assert.match(document.body.innerHTML, wrapped("Unknown"));
  });

  it("renders a dash when it doesn't have data", () => {
    React.render(factory, document.body);

    assert.match(document.body.innerHTML, wrapped("-"));
  });

});
