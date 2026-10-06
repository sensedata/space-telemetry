import type {Relay} from "../relay.ts";
import type {TimedRecord} from "../timed-record.ts";
import {isSameRecord} from "./is-same-record.ts";
import {LimitedStore, type LimitedStoreProps} from "./limited-store.ts";

// A channel's records, oldest first.
export class SimpleStore extends LimitedStore<TimedRecord> {
  constructor(relay: Relay, props?: LimitedStoreProps) {
    super(props);

    relay.register((records) => {
      this.update(records);
    });
  }

  override update(records: readonly TimedRecord[]): void {
    const held = this.get();
    const fresh = records.filter((record) => held.every((h) => !isSameRecord(h, record)));
    super.update([...held, ...fresh].toSorted((a, b) => a.t - b.t));
  }
}
