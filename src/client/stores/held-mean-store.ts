import {type CombinedRecord, CombiningStore} from "./combining-store.ts";

// A combination whose mean is not a combination of its channels' means. BulletMicrochart
// marks vm, so each record carries the mean of the values the store holds.
export abstract class HeldMeanStore extends CombiningStore {
  override update(records: readonly CombinedRecord[]): void {
    const held = this.prune(records);
    const mean = held.reduce((sum, {v}) => sum + v, 0) / held.length;
    super.update(held.map((record) => ({...record, vm: mean})));
  }
}
