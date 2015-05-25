import Chai from "chai";

import HistoricalStore from "../../../client/stores/historical_store.js";
import TelemetryActions from "../../../client/actions/telemetry_actions.js";

import "../dom_setup.js";
import TestHelper from "../test_helper.js";

const assert = Chai.assert;


describe("BulletChart", () => {
  let $;

  beforeEach("setup for TextReadout", (done) => {
    // jQuery can't be loaded until window and document are present.
    $ = require("jquery");
    $(() => {done();});
  });

  const bulletUI = function (props) {
    const viewProps = Object.assign({height: 10, width: 100}, props);
    return TestHelper.buildUI("bullet_chart.jsx", viewProps);
  };

  const renderBullet = function (props) {
    const ui = bulletUI(props);
    const capacityAction = ui.app.createActions("testcap", TelemetryActions);
    ui.props.capacityStore = ui.app.createStore("testcap", HistoricalStore, capacityAction.relay);
    ui.view = ui.React.createFactory(ui.viewClass)(ui.props);
    ui.React.render(ui.view, document.body);

    ui.action.relay([{t: 0, v: 1}]);
    capacityAction.relay([{t: 0, v: 2}]);
    return ui;
  };


  it("renders nothing without data", () => {
    const ui = bulletUI();
    ui.React.render(ui.view, document.body);

    assert.match(document.body.innerHTML, new RegExp("<noscript.*</noscript>"));
  });

  it("renders the full-range element with measure and static capacity", () => {
    const ui = bulletUI({capacity: 2});
    ui.React.render(ui.view, document.body);
    ui.action.relay([{t: 0, v: 1}]);

    assert.equal($("svg rect.range-3").attr("width"), 100);
  });

  it("renders the full-range element with measure and store-based capacity", () => {
    const ui = renderBullet();

    assert.equal($("svg rect.range-3").attr("width"), ui.props.width);
  });

  it("renders the measure element", () => {
    const ui = renderBullet();

    assert.equal($("svg line.measure").attr("x1"), 0);
    assert.equal($("svg line.measure").attr("x2"), ui.props.width / 2);
  });

  it("updates the measure element", () => {
    const ui = renderBullet();
    ui.action.relay([{t: 1, v: 1.5}]);

    assert.equal($("svg line.measure").attr("x1"), 0);
    assert.equal($("svg line.measure").attr("x2"), ui.props.width * 0.75);
  });

  it("renders the marker element at 90% if unspecified", () => {
    const ui = renderBullet();

    ["x1", "x2"].forEach((a) => {
      assert.equal($("svg line.marker").attr(a), ui.props.width * 0.9);
    });
  });

  it("renders the marker element as specified", () => {
    const ui = renderBullet({marker: "0.75"});

    ["x1", "x2"].forEach((a) => {
      assert.equal($("svg line.marker").attr(a), ui.props.width * 0.75);
    });
  });

});
