import Chai from "chai";

import StatusDictionary from "../../../../client/views/status_dictionary.js";
import TelemetryIndex from "../../../../client/telemetry_index.js";

import "../../dom_setup.js";
import TestHelper from "../../test_helper.js";

const assert = Chai.assert;


describe("TextReadout", () => {
  const payload = [{t: 0, v: 4}];
  const telemetryNumber = TelemetryIndex.number("USLAB000086");
  let ui;

  beforeEach("setup for TextReadout", () => {
    ui = TestHelper.buildUI(
      "readouts/text_readout.jsx", {telemetryNumber: telemetryNumber}
    );
  });

  const translated = (value) => {
    return TestHelper.wrap(StatusDictionary.get(telemetryNumber)[value]);
  };

  it("renders data received before mounting", () => {
    ui.action.relay(payload);
    ui.React.render(ui.view, document.body);

    assert.match(document.body.innerHTML, translated(payload[0].v));
  });

  it("renders data received after mounting", () => {
    ui.React.render(ui.view, document.body);
    ui.action.relay(payload);

    assert.match(document.body.innerHTML, translated(payload[0].v));
  });

  it("renders 'Unknown' for a unmappable value", () => {
    ui.React.render(ui.view, document.body);
    ui.action.relay([{t: 0, v: -1}]);

    assert.match(document.body.innerHTML, TestHelper.wrap("Unknown"));
  });

  it("renders a dash when it doesn't have data", () => {
    ui.React.render(ui.view, document.body);

    assert.match(document.body.innerHTML, TestHelper.wrap("-"));
  });

});
