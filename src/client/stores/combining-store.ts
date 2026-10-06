import type {Relay} from "../relay.ts";
import type {TimedRecord} from "../timed-record.ts";
import {isSameRecord} from "./is-same-record.ts";
import {LimitedStore, type LimitedStoreProps} from "./limited-store.ts";
import {hasValue, type ValuedRecord} from "./valued-record.ts";

// A channel's number and the relay that carries its records.
export type NumberedRelay = {readonly number: number; readonly relay: Relay};

// Several channels combined into one record per time any of them reported.
export type CombinedRecord = {
  // The numbers of the channels combined.
  readonly k: readonly number[];
  readonly v: number;
  readonly vm: number;
  readonly t: number;
};

// The newest record of each of the count channels that has reported by t, by channel
// number, and the sums of their values and means.
export type Sums = CombinedRecord & {
  readonly count: number;
  readonly newest: ReadonlyMap<number, ValuedRecord>;
};

export abstract class CombiningStore extends LimitedStore<CombinedRecord> {
  #times: readonly number[] = [];
  // Each channel's records, by channel number, oldest first.
  readonly telemetry = new Map<number, readonly ValuedRecord[]>();

  constructor(relays: readonly Relay[], props?: LimitedStoreProps) {
    super(props);

    for (const relay of relays) {
      relay.register((records) => {
        this.add(records);
      });
    }
  }

  #sumsAt(t: number): Sums {
    const newest = [...this.telemetry].flatMap(([k, held]) => {
      const record = held.findLast((r) => r.t <= t);
      return record ? [{k, record}] : [];
    });
    return {
      k: newest.map(({k}) => k),
      count: newest.length,
      newest: new Map(newest.map(({k, record}) => [k, record])),
      v: newest.reduce((sum, {record}) => sum + record.v, 0),
      vm: newest.reduce((sum, {record}) => sum + record.vm, 0),
      t,
    };
  }

  // Undefined where the channels reporting by the sums' time combine to no reading.
  protected abstract combine(sums: Sums): CombinedRecord | undefined;

  // A record without a value has nothing to add to the combination.
  add(records: readonly TimedRecord[]): void {
    const valued = records.filter(hasValue);
    if (valued.length === 0) {
      return;
    }

    for (const record of valued) {
      const held = this.telemetry.get(record.k) ?? [];
      if (held.some((h) => isSameRecord(h, record))) {
        continue;
      }

      this.telemetry.set(record.k, [...held, record]);
      this.#times = [...this.#times, record.t];
    }
    for (const [k, held] of this.telemetry) {
      this.telemetry.set(k, this.prune(held.toSorted((a, b) => a.t - b.t)));
    }
    this.#times = this.prune([...new Set(this.#times)].toSorted((a, b) => a - b));

    this.update(
      this.#times.flatMap((t) => {
        const combined = this.combine(this.#sumsAt(t));
        return combined ? [combined] : [];
      }),
    );
  }
}
