import Chai from "chai";
import Moment from "moment";

import "../../dom_setup.js";
import ClientHelper from "../../client_helper.js";

const assert = Chai.assert;


describe("TimestampReadout", () => {
  const timestamp = "13:16:30 2015.05.24";
  const unixTime = Moment.utc(timestamp, "HH:mm:ss YYYY.MM.DD").unix();

  let ui;

  beforeEach("setup for TimestampReadout", () => {
    ui = ClientHelper.buildUI("readouts/timestamp_readout.jsx");
  });

  it("renders data received before mounting", () => {
    ui.action.relay([{t: unixTime, v: 0}]);
    ui.React.render(ui.view, document.body);

    assert.match(document.body.innerHTML, ClientHelper.wrap(timestamp));
  });

  it("renders data received after mounting", () => {
    ui.React.render(ui.view, document.body);
    ui.action.relay([{t: unixTime, v: 0}]);

    assert.match(document.body.innerHTML, ClientHelper.wrap(timestamp));
  });

  it("renders a dash when it doesn't have data", () => {
    ui.React.render(ui.view, document.body);

    assert.match(document.body.innerHTML, ClientHelper.wrap("-"));
  });

  it("renders a dash when the time is 0", () => {
    ui.React.render(ui.view, document.body);
    ui.action.relay([{t: 0, v: 0}]);

    assert.match(document.body.innerHTML, ClientHelper.wrap("-"));
  });

});
