import Flummox from "flummox";
import Chai from "chai";

import QuaternionStore from "../../../client/stores/quaternion_store.js";
import TelemetryActions from "../../../client/actions/telemetry_actions.js";

const assert = Chai.assert;

// I found no formumlae that exactly matches THREE.js's approach to converting
// quaternions to euler angles, but the approach taken by de Buitléir and Baker
// seems to be close enough to validate the usage of THREE - ylg.
// http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToEuler/

describe("QuaternionStore", () => {

  let app;
  let xAction, yAction, zAction, wAction;
  let store;

  beforeEach("setup for QuaternionStore", () => {
    app = new Flummox();

    wAction = app.createActions("test-w", TelemetryActions);
    xAction = app.createActions("test-x", TelemetryActions);
    yAction = app.createActions("test-y", TelemetryActions);
    zAction = app.createActions("test-z", TelemetryActions);
    store = app.createStore("test", QuaternionStore, {
      maxSize: 3,
      axialActions: {
        w: wAction.relay,
        x: xAction.relay,
        y: yAction.relay,
        z: zAction.relay
      }
    });
  });


  it("returns an empty euler without data", () => {
    assert.equal(store.get().x, undefined);
    assert.equal(store.get().y, undefined);
    assert.equal(store.get().z, undefined);
  });

  it("correctly sets the X axis", () => {
    wAction.relay([{t: 1, v: 1}]);
    xAction.relay([{t: 1, v: 0.1}]);
    yAction.relay([{t: 1, v: 0.2}]);
    zAction.relay([{t: 1, v: 0.3}]);

    assert.equal(store.get()[0].x, 5.079607880930142);
  });

  it("correctly sets the Y axis", () => {
    wAction.relay([{t: 1, v: 1}]);
    xAction.relay([{t: 1, v: 0.1}]);
    yAction.relay([{t: 1, v: 0.2}]);
    zAction.relay([{t: 1, v: 0.3}]);

    assert.equal(store.get()[0].y, 27.387108041118893);
  });

  it("correctly sets the Z axis", () => {
    wAction.relay([{t: 1, v: 1}]);
    xAction.relay([{t: 1, v: 0.1}]);
    yAction.relay([{t: 1, v: 0.2}]);
    zAction.relay([{t: 1, v: 0.3}]);

    assert.equal(store.get()[0].z, 37.11686044533985);
  });

  it("correctly updates the euler axes with new data", () => {
    wAction.relay([{t: 1, v: 1}]);
    xAction.relay([{t: 1, v: 0.1}]);
    yAction.relay([{t: 1, v: 0.2}]);
    zAction.relay([{t: 1, v: 0.3}]);

    zAction.relay([{t: 2, v: 0.4}]);

    assert.equal(store.get()[0].x, 2.5448043903327315);
    assert.equal(store.get()[0].y, 28.685401313401833);
    assert.equal(store.get()[0].z, 51.709835350805335);
  });

});
