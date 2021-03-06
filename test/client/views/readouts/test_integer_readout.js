import Chai from "chai";

import IntegerReadout from "../../../../client/views/readouts/integer_readout.jsx";

import "../../dom_setup.js";
import ClientHelper from "../../client_helper.js";

const assert = Chai.assert;


describe("IntegerReadout", () => {
  const payload = [{t: 0, v: 97816348761234}];
  let ui;

  beforeEach("setup for IntegerReadout", () => {
    ui = ClientHelper.buildUI(IntegerReadout);
  });

  it("renders data received before mounting", () => {
    ui.action.relay(payload);
    ui.React.render(ui.viewFactory, document.body);

    assert.match(document.body.innerHTML, ClientHelper.wrap(payload[0].v));
  });

  it("renders data received after mounting", () => {
    ui.React.render(ui.viewFactory, document.body);
    ui.action.relay(payload);

    assert.match(document.body.innerHTML, ClientHelper.wrap(payload[0].v));
  });

  it("rounds decimals", () => {
    ui.React.render(ui.viewFactory, document.body);
    ui.action.relay([{t: 0, v: 10.6}]);

    assert.match(document.body.innerHTML, ClientHelper.wrap(11));
  });

  it("renders a dash when it doesn't have data", () => {
    ui.React.render(ui.viewFactory, document.body);
    assert.match(document.body.innerHTML, ClientHelper.wrap("-"));
  });

});
