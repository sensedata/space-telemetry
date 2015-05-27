import _ from "lodash";
import Flummox from "flummox";

import Chai from "chai";

import HistoricalStore from "../../../client/stores/historical_store.js";
import TelemetryActions from "../../../client/actions/telemetry_actions.js";

const assert = Chai.assert;


describe("HistoricalStore", () => {

  let action;
  let store;

  beforeEach("setup for HistoricalStore", () => {
    const app = new Flummox();
    action = app.createActions("test", TelemetryActions);
    store = app.createStore("test", HistoricalStore, action.relay, {maxSize: 3});
  });


  it("returns an empty array without data", () => {
    assert.deepEqual(store.get(), []);
  });

  it("returns data in descending order by time", () => {
    action.relay([{t: 1}, {t: 0}, {t: 2}]);

    assert.deepEqual(_.map(store.get(3), "t"), [2, 1, 0]);
  });

  it("prunes data in FIFO order when overloaded", () => {
    action.relay([{t: 1}, {t: 0}, {t: 2}, {t: 3}]);

    assert.deepEqual(_.map(store.get(4), "t"), [3, 2, 0]);
  });

});
