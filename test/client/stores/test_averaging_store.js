import Flummox from "flummox";

import Chai from "chai";

import AveragingStore from "../../../client/stores/averaging_store.js";
import TelemetryActions from "../../../client/actions/telemetry_actions.js";

const assert = Chai.assert;


describe("AveragingStore", () => {

  let action1;
  let action2;
  let store;

  beforeEach("setup for AveragingStore", () => {
    const app = new Flummox();
    action1 = app.createActions("test1", TelemetryActions);
    action2 = app.createActions("test2", TelemetryActions);
    store = app.createStore("test", AveragingStore, [action1.relay, action2.relay]);
  });


  it("has an empty key array before actions fire", () => {
    assert.deepEqual(store.get()[0].k, []);
  });

  it("returns an average value after actions fire", () => {
    action1.relay([{k: 1, t: 1, v: 1}]);
    action2.relay([{k: 2, t: 1, v: 3}]);

    assert.equal(store.get()[0].v, 2);
  });

  it("returns all keys after actions fire", () => {
    action1.relay([{k: 1, t: 1, v: 1}]);
    action2.relay([{k: 2, t: 1, v: 3}]);

    assert.deepEqual(store.get()[0].k, [1, 2]);
  });

  it("does not duplicate keys", () => {
    action1.relay([{k: 1, t: 1, v: 1}]);
    action2.relay([{k: 2, t: 1, v: 3}]);
    action1.relay([{k: 1, t: 2, v: 1}]);

    assert.deepEqual(store.get()[0].k, [1, 2]);
  });

  it("updates averages correctly with new values for old keys", () => {
    action1.relay([{k: 1, t: 1, v: 1}]);
    action2.relay([{k: 2, t: 1, v: 3}]);
    action1.relay([{k: 1, t: 2, v: 2}]);

    assert.equal(store.get()[0].v, 2.5);
  });

  it("handles empty data", () => {
    action1.relay([]);
    action2.relay([]);

    assert.equal(store.get()[0].v, 0);
  });

});
