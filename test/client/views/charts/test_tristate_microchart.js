import _ from "lodash";
import Chai from "chai";
import Moment from "moment";

import TristateMicrochart from "../../../../client/views/charts/tristate_microchart.jsx";

import "../../dom_setup.js";
import ClientHelper from "../../client_helper.js";

const assert = Chai.assert;


describe("TristateMicrochart", () => {
  let $;

  beforeEach("setup for TristateMicrochart", (done) => {
    // jQuery can't be loaded until window and document are present.
    $ = require("jquery");
    $(() => {done();});
  });

  const tristateUI = function (props) {
    const viewProps = Object.assign({height: 100, width: 100}, props);
    return ClientHelper.buildUI(TristateMicrochart, viewProps);
  };

  const renderTristate = function (props) {
    const ui = tristateUI(props);
    ui.view = ui.React.render(ui.viewFactory, document.body);
    const now = Moment().unix();
    const data = _.times(4, (n) => {return {t: now - n, v: n % 2};});

    ui.action.relay(data);
    return ui;
  };


  it("renders nothing without data", () => {
    const ui = tristateUI();
    ui.React.render(ui.viewFactory, document.body);

    assert.match(document.body.innerHTML, new RegExp("\\s*<noscript.*></noscript>\\s*"));
  });

  it("sets its size to that of its container", () => {
    const ui = renderTristate();

    assert.equal($("svg").attr("height"), ui.props.height);
    assert.equal($("svg").attr("width"), ui.props.width);
  });

  it("draws a simple set of points correctly", () => {
    const ui = renderTristate({width: 12});
    const data = [0, 1, 1, 0];
    const start = Moment().subtract(4, "seconds").unix();

    data.forEach((d, i) => {
      ui.action.relay([{t: start + i, v: d}]);
    });

    data.forEach((d, i) => {
      const bar = $(`svg rect:nth-child(${i + 1})`);
      assert.equal(bar.attr("x"), i * 3, `x for data[${i}]`);
      assert.equal(bar.attr("y"), d > 0 ? 0 : 50, `y for data[${i}]`);
      assert.equal(bar.attr("height"), 50, `height for data[${i}]`);
    });
  });

  it("add a left-most point if there isn't one in the data", () => {
    const ui = renderTristate({width: 12});
    const data = [1, 1, 0];
    const start = Moment().subtract(3, "seconds").unix();

    data.forEach((d, i) => {
      ui.action.relay([{t: start + i, v: d}]);
    });

    data.unshift(1);
    data.forEach((d, i) => {
      const bar = $(`svg rect:nth-child(${i + 1})`);
      assert.equal(bar.attr("x"), i * 3, `x for data[${i}]`);
      assert.equal(bar.attr("y"), d > 0 ? 0 : 50, `y for data[${i}]`);
      assert.equal(bar.attr("height"), 50, `height for data[${i}]`);
    });
  });

  it("adds a right-most point if the newest data is old", () => {
    const ui = renderTristate({width: 12});
    const data = [0, 1, 1];
    const start = Moment().subtract(4, "seconds").unix();

    data.forEach((d, i) => {
      ui.action.relay([{t: start + i, v: d}]);
    });

    data.push(1);
    data.forEach((d, i) => {
      const bar = $(`svg rect:nth-child(${i + 1})`);
      assert.equal(bar.attr("x"), i * 3, `x for data[${i}]`);
      assert.equal(bar.attr("y"), d > 0 ? 0 : 50, `y for data[${i}]`);
      assert.equal(bar.attr("height"), 50, `height for data[${i}]`);
    });
  });

  it("sets lastUpdate correctly", () => {
    const ui = tristateUI();
    ui.view = ui.React.render(ui.viewFactory, document.body);

    assert.equal(ui.view.lastUpdate, 0);
    ui.action.relay([{t: 1, v: 1}]);
    assert.isBelow(Moment().unix() - ui.view.lastUpdate, 2);
  });

});
