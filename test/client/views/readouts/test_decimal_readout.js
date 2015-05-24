import Chai from "chai";

import "../../dom_setup.js";
import TestHelper from "../../test_helper.js";

const assert = Chai.assert;


describe("DecimalReadout", () => {
  const payload = [{t: 0, v: 9.7816348761234}];
  let ui;

  beforeEach("setup for DecimalReadout", () => {
    ui = TestHelper.buildUI("readouts/decimal_readout.jsx");
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

  it("renders a dash when it doesn't have data", () => {
    ui.React.render(ui.view, document.body);
    assert.match(document.body.innerHTML, TestHelper.wrap("-"));
  });

  it("renders the euler axis of quaternions", () => {
    document.body.dataset.eulerAxis = "w";
    document.body.dataset.quaternionId = "test";
    ui.React.render(ui.view, document.body);
    ui.action.relay([{w: "1234"}]);

    assert.match(document.body.innerHTML, TestHelper.wrap(1234));
  });

  it("rounds to scale", () => {
    document.body.dataset.scale = "3";
    ui.React.render(ui.view, document.body);
    ui.action.relay(payload);

    assert.match(document.body.innerHTML, TestHelper.wrap(9.782));
  });

  it("pads to the left with zeros with precision", () => {
    document.body.dataset.precision = "3";
    ui.React.render(ui.view, document.body);
    ui.action.relay(payload);

    assert.match(document.body.innerHTML, TestHelper.wrap("009.7816348761234"));
  });

  it("rounds and pads together", () => {
    document.body.dataset.precision = "3";
    document.body.dataset.scale = "3";
    ui.React.render(ui.view, document.body);
    ui.action.relay(payload);

    assert.match(document.body.innerHTML, TestHelper.wrap("009.782"));
  });

});
