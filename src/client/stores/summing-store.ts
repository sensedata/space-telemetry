import {type CombinedRecord, CombiningStore, type Sums} from "./combining-store.ts";

export class SummingStore extends CombiningStore {
  protected combine({k, v, vm, t}: Sums): CombinedRecord {
    return {k, v, vm, t};
  }
}
