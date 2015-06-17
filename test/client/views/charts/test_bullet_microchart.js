import Chai from "chai";

import SimpleStore from "../../../../client/stores/simple_store.js";
import TelemetryActions from "../../../../client/actions/telemetry_actions.js";

import "../../dom_setup.js";
import ClientHelper from "../../client_helper.js";

const assert = Chai.assert;


describe("BulletMicrochart", () => {
  let $;

  beforeEach("setup for BulletMicrochart", (done) => {
    // jQuery can't be loaded until window and document are present.
    $ = require("jquery");
    $(() => {done();});
  });

  const bulletUI = function (props) {
    const viewProps = Object.assign({height: 10, width: 100}, props);
    return ClientHelper.buildUI("charts/bullet_microchart.jsx", viewProps);
  };

  const renderBullet = function (props) {
    const ui = bulletUI(props);
    const capacityAction = ui.app.createActions("testcap", TelemetryActions);
    ui.props.capacityStore = ui.app.createStore(
      "testcap", SimpleStore, capacityAction.relay, {maxSize: 200}
    );
    ui.view = ui.React.createFactory(ui.viewClass)(ui.props);
    ui.React.render(ui.view, document.body);

    ui.action.relay([{t: 0, v: 1, vm: 0.5}]);
    capacityAction.relay([{t: 0, v: 2}]);
    return ui;
  };


  it("renders nothing without data", () => {
    const ui = bulletUI();
    ui.React.render(ui.view, document.body);

    assert.match(document.body.innerHTML, new RegExp("\\s*<noscript.*></noscript>\\s*"));
  });

  it("sets its size to that of its container", () => {
    const ui = renderBullet();

    assert.equal($("svg").attr("height"), ui.props.height);
    assert.equal($("svg").attr("width"), ui.props.width);
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

  it("renders the marker element at the mean if unspecified", () => {
    renderBullet();

    ["x1", "x2"].forEach((a) => {
      assert.equal($("svg line.marker").attr(a), 25);
    });
  });

  it("renders the marker element at negative mean", () => {
    const ui = bulletUI();
    const capacityAction = ui.app.createActions("testcap", TelemetryActions);
    ui.props.capacityStore = ui.app.createStore(
      "testcap", SimpleStore, capacityAction.relay, {maxSize: 200}
    );
    ui.view = ui.React.createFactory(ui.viewClass)(ui.props);
    ui.React.render(ui.view, document.body);

    ui.action.relay([{t: 0, v: 1, vm: -0.5}]);
    capacityAction.relay([{t: 0, v: 2}]);

    ["x1", "x2"].forEach((a) => {
      assert.equal($("svg line.marker").attr(a), 25);
    });
  });

  it("renders the marker element as specified", () => {
    renderBullet({marker: "0.75"});

    ["x1", "x2"].forEach((a) => {
      assert.equal($("svg line.marker").attr(a), 37.5);
    });
  });

  it("applies the conversion to the measure", () => {
    const ui = renderBullet({conversion: 2});

    assert.equal($("svg line.measure").attr("x2"), ui.props.width);
  });

  it("renders a negative measure", () => {
    const ui = bulletUI();
    const capacityAction = ui.app.createActions("testcap", TelemetryActions);
    ui.props.capacityStore = ui.app.createStore(
      "testcap", SimpleStore, capacityAction.relay, {maxSize: 200}
    );
    ui.view = ui.React.createFactory(ui.viewClass)(ui.props);
    ui.React.render(ui.view, document.body);

    ui.action.relay([{t: 0, v: -1, vm: 0.5}]);
    capacityAction.relay([{t: 0, v: 2}]);

    assert.equal($("svg line.measure").attr("x1"), 0);
    assert.equal($("svg line.measure").attr("x2"), ui.props.width / 2);
  });

});
