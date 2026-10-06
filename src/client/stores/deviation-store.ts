import {type CombinedRecord, CombiningStore, type Sums} from "./combining-store.ts";

// The largest distance of any one channel from the mean of them all, for the newest values
// and for the channels' means alike.
export class DeviationStore extends CombiningStore {
  protected combine({k, count, newest, v, vm, t}: Sums): CombinedRecord {
    const records = newest.values().toArray();
    return {
      k,
      v: Math.max(...records.map((record) => Math.abs(record.v - v / count))),
      vm: Math.max(...records.map((record) => Math.abs(record.vm - vm / count))),
      t,
    };
  }
}
