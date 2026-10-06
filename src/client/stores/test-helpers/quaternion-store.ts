import {test as base} from "vitest";

import {Relay} from "../../relay.ts";
import {QuaternionStore} from "../quaternion-store.ts";

// store turns the quaternion that wRelay, xRelay, yRelay and zRelay carry into Euler angles.
export const test = base
  .extend("wRelay", () => new Relay())
  .extend("xRelay", () => new Relay())
  .extend("yRelay", () => new Relay())
  .extend("zRelay", () => new Relay())
  .extend(
    "store",
    ({wRelay, xRelay, yRelay, zRelay}) =>
      new QuaternionStore({w: wRelay, x: xRelay, y: yRelay, z: zRelay}),
  );
