import {Euler, MathUtils, Quaternion} from "three";

import type {Relay} from "../relay.ts";
import type {TimedRecord} from "../timed-record.ts";
import {newestRecord} from "./newest-record.ts";
import {Store} from "./store.ts";
import {hasValue} from "./valued-record.ts";

export type Axis = "x" | "y" | "z" | "w";

// Yaw about z, pitch about y and roll about x, in degrees; undefined until an axis
// reports.
export type EulerAngles = {
  readonly x: number | undefined;
  readonly y: number | undefined;
  readonly z: number | undefined;
};

const AXES: readonly Axis[] = ["x", "y", "z", "w"];

// The attitude a quaternion of four channels, one per axis, gives.
export class QuaternionStore extends Store<EulerAngles> {
  readonly #euler = new Euler();
  readonly #quaternion = new Quaternion();

  constructor(axialRelays: Readonly<Record<Axis, Relay>>) {
    super({x: undefined, y: undefined, z: undefined});

    for (const axis of AXES) {
      axialRelays[axis].register((records) => {
        this.#update(axis, records);
      });
    }
  }

  // An axis keeps its value until a record with one arrives.
  #update(axis: Axis, records: readonly TimedRecord[]): void {
    const newest = newestRecord(records.filter(hasValue));
    if (newest === undefined) {
      return;
    }

    this.#quaternion[axis] = newest.v;
    // See https://space.stackexchange.com/a/22423/18909
    this.#euler.setFromQuaternion(this.#quaternion.clone().normalize(), "ZYX");

    this.setState({
      x: MathUtils.radToDeg(this.#euler.x),
      y: MathUtils.radToDeg(this.#euler.y),
      z: MathUtils.radToDeg(this.#euler.z),
    });
  }

  get(): readonly [EulerAngles] {
    return [this.state];
  }
}
