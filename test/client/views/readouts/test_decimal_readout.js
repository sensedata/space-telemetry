import Chai from "chai";

import DecimalReadout from "../../../../client/views/readouts/decimal_readout.jsx";

import "../../dom_setup.js";
import ClientHelper from "../../client_helper.js";

const assert = Chai.assert;


describe("DecimalReadout", () => {
  const payload = [{t: 0, v: 9.7816348761234}];

  it("renders data received before mounting", () => {
    const ui = ClientHelper.buildUI(DecimalReadout);
    ui.action.relay(payload);
    ui.React.render(ui.view, document.body);

    assert.match(document.body.innerHTML, ClientHelper.wrap(payload[0].v));
  });

  it("renders data received after mounting", () => {
    const ui = ClientHelper.buildUI(DecimalReadout);
    ui.React.render(ui.view, document.body);
    ui.action.relay(payload);

    assert.match(document.body.innerHTML, ClientHelper.wrap(payload[0].v));
  });

  it("renders a dash when it doesn't have data", () => {
    const ui = ClientHelper.buildUI(DecimalReadout);
    ui.React.render(ui.view, document.body);
    assert.match(document.body.innerHTML, ClientHelper.wrap("-"));
  });

  it("renders the euler axis of quaternions", () => {
    const ui = ClientHelper.buildUI(
      DecimalReadout, {eulerAxis: "w", quaternionId: "test"}
    );
    ui.React.render(ui.view, document.body);
    ui.action.relay([{w: "1234"}]);

    assert.match(document.body.innerHTML, ClientHelper.wrap(1234));
  });

  it("rounds to scale", () => {
    const ui = ClientHelper.buildUI(DecimalReadout, {scale: 3});
    ui.React.render(ui.view, document.body);
    ui.action.relay(payload);

    assert.match(document.body.innerHTML, ClientHelper.wrap(9.782));
  });

  it("pads to the left with zeros with precision", () => {
    const ui = ClientHelper.buildUI(DecimalReadout, {precision: 3});
    ui.React.render(ui.view, document.body);
    ui.action.relay(payload);

    assert.match(document.body.innerHTML, ClientHelper.wrap("009.7816348761234"));
  });

  it("rounds and pads together", () => {
    const ui = ClientHelper.buildUI(DecimalReadout, {precision: 3, scale: 3});
    ui.React.render(ui.view, document.body);
    ui.action.relay(payload);

    assert.match(document.body.innerHTML, ClientHelper.wrap("009.782"));
  });

});
