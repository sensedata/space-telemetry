import type {TimedRecord} from "../timed-record.ts";
import {newestRecord} from "./newest-record.ts";
import {Store} from "./store.ts";

const DELAY_ERROR_MARGIN = 60;

// The newest record of the channels it is registered for.
export class LatestStore extends Store<{latest: TimedRecord | undefined}> {
  constructor() {
    super({latest: undefined});
  }

  update(records: readonly TimedRecord[]): void {
    // Some Lightstreamer data is timestamped far in the future, presumably a bug in their
    // processing or NASA's, so a record more than a minute ahead of the clock is ignored.
    const unixNow = Math.round(Date.now() / 1000) + DELAY_ERROR_MARGIN;
    const newest = newestRecord(records.filter((record) => record.t <= unixNow));
    // An empty backfill leaves the record held.
    if (newest === undefined) {
      return;
    }
    const {latest} = this.state;
    // Within a second the later arrival is the newer record.
    if (latest === undefined || newest.t >= latest.t) {
      this.setState({latest: newest});
    }
  }

  get(): readonly TimedRecord[] {
    return this.state.latest ? [this.state.latest] : [];
  }
}
