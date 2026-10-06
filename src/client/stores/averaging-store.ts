import {type CombinedRecord, CombiningStore, type Sums} from "./combining-store.ts";

export class AveragingStore extends CombiningStore {
  protected combine({k, count, v, vm, t}: Sums): CombinedRecord {
    return {k, v: v / count, vm: vm / count, t};
  }
}
