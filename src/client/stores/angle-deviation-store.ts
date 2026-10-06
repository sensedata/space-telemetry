import {type CombinedRecord, type NumberedRelay, type Sums} from "./combining-store.ts";
import {HeldMeanStore} from "./held-mean-store.ts";
import type {LimitedStoreProps} from "./limited-store.ts";

// A channel that carries an angle in degrees, and how its mounting mirrors the others': a
// negated angle counts the other way round, and a turned one starts half a turn away.
export type MirroredAngle<Channel> = {
  readonly channel: Channel;
  readonly negated: boolean;
  readonly turned: boolean;
};

const RADIANS = Math.PI / 180;

// The degrees between two angles, the short way round.
function apart(a: number, b: number): number {
  return Math.abs(((((a - b + 180) % 360) + 360) % 360) - 180);
}

// The largest distance of any one angle from the mean direction of them all, each angle
// first undone of its mounting's mirroring. A channel's own mean is of angles either side
// of the turn from 360 to 0, so it is no direction; the store marks the mean it holds.
export class AngleDeviationStore extends HeldMeanStore {
  readonly #angles: readonly MirroredAngle<number>[];

  constructor(
    angles: readonly MirroredAngle<NumberedRelay>[],
    props?: LimitedStoreProps,
  ) {
    super(
      angles.map(({channel}) => channel.relay),
      props,
    );
    this.#angles = angles.map((angle) => ({...angle, channel: angle.channel.number}));
  }

  protected combine({k, newest, t}: Sums): CombinedRecord {
    const degrees = this.#angles.flatMap(({channel, negated, turned}) => {
      const record = newest.get(channel);
      return record ? [(negated ? -record.v : record.v) + (turned ? 180 : 0)] : [];
    });
    const mean =
      Math.atan2(
        degrees.reduce((sum, angle) => sum + Math.sin(angle * RADIANS), 0),
        degrees.reduce((sum, angle) => sum + Math.cos(angle * RADIANS), 0),
      ) / RADIANS;
    return {k, v: Math.max(...degrees.map((angle) => apart(angle, mean))), vm: 0, t};
  }
}
