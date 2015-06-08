import _ from "lodash";
import Chai from "chai";
import Moment from "moment";

import HistoricalStore from "../../../../client/stores/historical_store.js";
import TelemetryActions from "../../../../client/actions/telemetry_actions.js";

import "../../dom_setup.js";
import TestHelper from "../../test_helper.js";

const assert = Chai.assert;


describe("SparklineChart", () => {
  let $;

  beforeEach("setup for SparklineChart", (done) => {
    // jQuery can't be loaded until window and document are present.
    $ = require("jquery");
    $(() => {done();});
  });

  const sparkUI = function (props) {
    const viewProps = Object.assign({height: 100, width: 100}, props);
    return TestHelper.buildUI("charts/sparkline_chart.jsx", viewProps);
  };

  const renderSpark = function (props) {
    const ui = sparkUI(props);
    const capacityAction = ui.app.createActions("testcap", TelemetryActions);
    ui.props.capacityStore = ui.app.createStore("testcap", HistoricalStore, capacityAction.relay);
    ui.view = ui.React.createFactory(ui.viewClass)(ui.props);
    ui.React.render(ui.view, document.body);

    ui.action.relay([{t: 0, v: 1}]);
    capacityAction.relay([{t: 0, v: 2}]);
    return ui;
  };


  it("renders nothing without data", () => {
    const ui = sparkUI();
    ui.React.render(ui.view, document.body);

    assert.match(document.body.innerHTML, new RegExp("\\s*<noscript.*></noscript>\\s*"));
  });

  it("sets its size to that of its container", () => {
    const ui = sparkUI();
    ui.React.render(ui.view, document.body);
    const now = Moment().unix();
    const data = _.times(4, (n) => {return {t: now - n, v: n * 10};});

    ui.action.relay(data);
    assert.equal($("svg").attr("height"), ui.props.height);
    assert.equal($("svg").attr("width"), ui.props.width);
  });

  it("add a left-most point if there isn't one in the data");

  it("adds a right-most point if the newest data is old");

  it("renders a correct qualitative range");//, () => {
  //   const ui = sparkUI();
  //   ui.React.render(ui.view, document.body);
  //   const now = Moment().unix();
  //   const data = _.times(4, (n) => {return {t: now - n, v: n * 10};});
  //
  //   ui.action.relay(data);
  //   assert.equal($("svg path").attr("d"), "x");
  // });

});
