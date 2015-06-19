import Chai from "chai";
import Moment from "moment";

import BarMicrochart from "../../../../client/views/charts/bar_microchart.jsx";

import "../../dom_setup.js";
import ClientHelper from "../../client_helper.js";

const assert = Chai.assert;


describe("BarMicrochart", () => {
  let $;

  beforeEach("setup for BarMicrochart", (done) => {
    // jQuery can't be loaded until window and document are present.
    $ = require("jquery");
    $(() => {done();});
  });

  const barUI = function (props) {
    const viewProps = Object.assign({height: 10, width: 100}, props);
    return ClientHelper.buildUI(BarMicrochart, viewProps);
  };

  const renderBar = function (props) {
    const ui = barUI(props);
    ui.view = ui.React.render(ui.viewFactory, document.body);

    return ui;
  };


  it("renders nothing without data", () => {
    renderBar();

    assert.match(document.body.innerHTML, new RegExp("\\s*<noscript.*></noscript>\\s*"));
  });

  it("sets its size to that of its container", () => {
    const ui = renderBar();
    ui.action.relay([{t: 0, v: 0}]);

    assert.equal($("svg").attr("height"), ui.props.height);
    assert.equal($("svg").attr("width"), ui.props.width);
  });

  it("draws one bar per three pixels of width", () => {
    const ui = renderBar({width: 9 + 2});
    ui.action.relay([{t: 0, v: 0}]);

    assert.equal($("svg rect").length, 3);
  });

  it("draws a simple set of points correctly", () => {
    const ui = renderBar({width: 12});
    const data = [0, 1, 5, 10];
    const start = Moment().subtract(4, "seconds").unix();

    data.forEach((d, i) => {
      ui.action.relay([{t: start + i, v: d}]);
    });

    data.forEach((d, i) => {
      const bar = $(`svg rect:nth-child(${i + 1})`);
      assert.equal(bar.attr("x"), i * 3, `x for data[${i}]`);
      assert.equal(bar.attr("y"), 10 - d, `y for data[${i}]`);
      assert.equal(bar.attr("height"), d, `height for data[${i}]`);
    });
  });

  it("add a left-most point if there isn't one in the data", () => {
    const ui = renderBar({width: 12});
    const data = [0, 5, 10];
    const start = Moment().subtract(3, "seconds").unix();

    data.forEach((d, i) => {
      ui.action.relay([{t: start + i, v: d}]);
    });

    data.unshift(0);
    data.forEach((d, i) => {
      const bar = $(`svg rect:nth-child(${i + 1})`);
      assert.equal(bar.attr("x"), i * 3, `x for data[${i}]`);
      assert.equal(bar.attr("y"), 10 - d, `y for data[${i}]`);
      assert.equal(bar.attr("height"), d, `height for data[${i}]`);
    });
  });

  it("adds a right-most point if the newest data is old", () => {
    const ui = renderBar({width: 12});
    const data = [0, 5, 10];
    const start = Moment().subtract(4, "seconds").unix();

    data.forEach((d, i) => {
      ui.action.relay([{t: start + i, v: d}]);
    });

    data.push(10);
    data.forEach((d, i) => {
      const bar = $(`svg rect:nth-child(${i + 1})`);
      assert.equal(bar.attr("x"), i * 3, `x for data[${i}]`);
      assert.equal(bar.attr("y"), 10 - d, `y for data[${i}]`);
      assert.equal(bar.attr("height"), d, `height for data[${i}]`);
    });
  });

  it("sets lastUpdate correctly", () => {
    const ui = renderBar({width: 12});

    assert.equal(ui.view.lastUpdate, 0);
    ui.action.relay([{t: 1, v: 1}]);
    assert.isBelow(Moment().unix() - ui.view.lastUpdate, 2);
  });
});
