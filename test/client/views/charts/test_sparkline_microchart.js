import _ from "lodash";
import Chai from "chai";
import Moment from "moment";

import SimpleStore from "../../../../client/stores/simple_store.js";
import SparklineMicrochart from "../../../../client/views/charts/sparkline_microchart.jsx";
import TelemetryActions from "../../../../client/actions/telemetry_actions.js";

import "../../dom_setup.js";
import ClientHelper from "../../client_helper.js";

const assert = Chai.assert;


describe("SparklineMicrochart", () => {
  let $;

  beforeEach("setup for SparklineMicrochart", (done) => {
    // jQuery can't be loaded until window and document are present.
    $ = require("jquery");
    $(() => {done();});
  });

  const sparkUI = function (props) {
    const viewProps = Object.assign({height: 100, width: 100}, props);
    return ClientHelper.buildUI(SparklineMicrochart, viewProps);
  };

  const renderSpark = function (props) {
    const ui = sparkUI(props);
    ui.view = ui.React.render(ui.viewFactory, document.body);

    ui.action.relay([{t: 0, v: 1}]);
    return ui;
  };


  it("renders nothing without data", () => {
    const ui = sparkUI();
    ui.React.render(ui.viewFactory, document.body);

    assert.match(document.body.innerHTML, new RegExp("\\s*<noscript.*></noscript>\\s*"));
  });

  it("sets its size to that of its container", () => {
    const ui = renderSpark();

    assert.equal($("svg").attr("height"), ui.props.height);
    assert.equal($("svg").attr("width"), ui.props.width);
  });

  it("draws a simple set of points correctly", () => {
    const ui = sparkUI({width: 4 + 6, height: 10 + 4});
    ui.view = ui.React.render(ui.viewFactory, document.body);

    const data = [0, 1, 5, 10];
    const start = Moment().subtract(4, "seconds").unix();

    data.forEach((d, i) => {
      ui.action.relay([{t: start + i, v: d}]);
    });

    // Without recreating a good part of D3, there's no reasonable way to
    // predict a spark line path's points, so this is just a copy paste of
    // path visually inspected for correctness, i.e., "looks good to me."
    assert.equal(
      $("svg path").attr("d"),
      "M0,0L0.16666666666666666,0C0.3333333333333333,0,0.6666666666666666,0,1,0.16666666666666666C1.3333333333333333,0.3333333333333333,1.6666666666666665,0.6666666666666666,2,1.5C2.333333333333333,2.333333333333333,2.6666666666666665,3.6666666666666665,3,5.166666666666666C3.333333333333333,6.666666666666666,3.6666666666666665,8.333333333333332,3.833333333333333,9.166666666666666L4,10"
    );
  });

  it("renders a correct qualitative range");

  it("sets lastUpdate correctly", () => {
    const ui = sparkUI();
    ui.view = ui.React.render(ui.viewFactory, document.body);

    assert.equal(ui.view.lastUpdate, 0);
    ui.action.relay([{t: 0, v: 1}]);
    assert.isBelow(Moment().unix() - ui.view.lastUpdate, 2);
  });

});
