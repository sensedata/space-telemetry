import {type CombinedRecord, type NumberedRelay, type Sums} from "./combining-store.ts";
import {HeldMeanStore} from "./held-mean-store.ts";
import type {LimitedStoreProps} from "./limited-store.ts";

// One supply's voltage channel and current channel.
export type PowerPair<Channel> = {readonly volts: Channel; readonly amps: Channel};

// The watts of several supplies: each pair's volts times its amps, summed. A pair counts
// once both of its channels have reported, and until one does there are no watts. A supply's volts and amps rise and fall together,
// so the product of the channels' means is not the mean power; the store marks the mean it
// holds.
export class PowerStore extends HeldMeanStore {
  readonly #pairs: readonly PowerPair<number>[];

  constructor(pairs: readonly PowerPair<NumberedRelay>[], props?: LimitedStoreProps) {
    super(
      pairs.flatMap(({volts, amps}) => [volts.relay, amps.relay]),
      props,
    );
    this.#pairs = pairs.map(({volts, amps}) => ({
      volts: volts.number,
      amps: amps.number,
    }));
  }

  protected combine({newest, t}: Sums): CombinedRecord | undefined {
    const reporting = this.#pairs.flatMap((pair) => {
      const volts = newest.get(pair.volts);
      const amps = newest.get(pair.amps);
      return volts && amps ? [{pair, watts: volts.v * amps.v}] : [];
    });
    if (reporting.length === 0) {
      return undefined;
    }
    return {
      k: reporting.flatMap(({pair}) => [pair.volts, pair.amps]),
      v: reporting.reduce((sum, {watts}) => sum + watts, 0),
      vm: 0,
      t,
    };
  }
}
