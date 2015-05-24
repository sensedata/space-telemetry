import Chai from "chai";

import "../../dom_setup.js";
import TestHelper from "../../test_helper.js";

const assert = Chai.assert;


describe("IntegerReadout", () => {
  const payload = [{t: 0, v: 97816348761234}];
  let ui;

  beforeEach("setup for IntegerReadout", () => {
    ui = TestHelper.buildUI("readouts/integer_readout.jsx");
  });

  it("renders data received before mounting", () => {
    ui.action.relay(payload);
    ui.React.render(ui.view, document.body);

    assert.match(document.body.innerHTML, TestHelper.wrap(payload[0].v));
  });

  it("renders data received after mounting", () => {
    ui.React.render(ui.view, document.body);
    ui.action.relay(payload);

    assert.match(document.body.innerHTML, TestHelper.wrap(payload[0].v));
  });

  it("rounds decimals", () => {
    ui.React.render(ui.view, document.body);
    ui.action.relay([{t: 0, v: 10.6}]);

    assert.match(document.body.innerHTML, TestHelper.wrap(11));
  });

  it("renders a dash when it doesn't have data", () => {
    ui.React.render(ui.view, document.body);
    assert.match(document.body.innerHTML, TestHelper.wrap("-"));
  });

});
