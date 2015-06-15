import _ from "lodash";
import Flummox from "flummox";

import Chai from "chai";

import SimpleStore from "../../../client/stores/simple_store.js";
import TelemetryActions from "../../../client/actions/telemetry_actions.js";

const assert = Chai.assert;


describe("SimpleStore", () => {

  let app;
  let action;
  let store;

  beforeEach("setup for SimpleStore", () => {
    app = new Flummox();
    action = app.createActions("test", TelemetryActions);
    store = app.createStore("test", SimpleStore, action.relay, {maxSize: 3});
  });


  it("returns an empty array without data", () => {
    assert.deepEqual(store.get(), []);
  });

  it("returns data in ascending order by time", () => {
    action.relay([{t: 1}, {t: 0}, {t: 2}]);

    assert.deepEqual(_.map(store.get(), "t"), [0, 1, 2]);
  });

  it("prunes data in time order when overloaded", () => {
    action.relay([{t: 1}, {t: 0}, {t: 2}, {t: 3}]);

    assert.deepEqual(_.map(store.get(), "t"), [1, 2, 3]);
  });

  it("defaults max size to one when omitted", () => {
    store = app.createStore("test2", SimpleStore, action.relay, {});
    action.relay([{t: 1}, {t: 0}, {t: 2}, {t: 3}]);

    assert.deepEqual(_.map(store.get(), "t"), [3]);
  });

  it("defaults max size to one when props are omitted", () => {
    store = app.createStore("test2", SimpleStore, action.relay);
    action.relay([{t: 1}, {t: 0}, {t: 2}, {t: 3}]);

    assert.deepEqual(_.map(store.get(), "t"), [3]);
  });

});
