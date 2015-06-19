import Chai from "chai";

import StatusDictionary from "../../../../client/views/status_dictionary.js";
import TelemetryIndex from "../../../../client/telemetry_index.js";
import TextReadout from "../../../../client/views/readouts/text_readout.jsx";

import "../../dom_setup.js";
import ClientHelper from "../../client_helper.js";

const assert = Chai.assert;


describe("TextReadout", () => {
  const payload = [{t: 0, v: 4}];
  const telemetryNumber = TelemetryIndex.number("USLAB000086");
  let ui;

  beforeEach("setup for TextReadout", () => {
    ui = ClientHelper.buildUI(TextReadout, {telemetryNumber: telemetryNumber});
  });

  const translated = (value) => {
    return ClientHelper.wrap(StatusDictionary.get(telemetryNumber)[value]);
  };

  it("renders data received before mounting", () => {
    ui.action.relay(payload);
    ui.React.render(ui.viewFactory, document.body);

    assert.match(document.body.innerHTML, translated(payload[0].v));
  });

  it("renders data received after mounting", () => {
    ui.React.render(ui.viewFactory, document.body);
    ui.action.relay(payload);

    assert.match(document.body.innerHTML, translated(payload[0].v));
  });

  it("renders 'Unknown' for a unmappable value", () => {
    ui.React.render(ui.viewFactory, document.body);
    ui.action.relay([{t: 0, v: -1}]);

    assert.match(document.body.innerHTML, ClientHelper.wrap("Unknown"));
  });

  it("renders a dash when it doesn't have data", () => {
    ui.React.render(ui.viewFactory, document.body);

    assert.match(document.body.innerHTML, ClientHelper.wrap("-"));
  });

});
