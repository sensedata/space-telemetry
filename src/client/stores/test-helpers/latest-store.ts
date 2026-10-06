import {Relay} from "../../relay.ts";
import {test as fakeClockTest} from "../../test-helpers/fake-clock.ts";
import {LatestStore} from "../latest-store.ts";

// store takes each batch relay carries. The fake clock of fake-clock.ts runs under every test,
// as LatestStore ignores records ahead of it.
export const test = fakeClockTest
  .extend("relay", () => new Relay())
  .extend("store", ({relay}) => {
    const store = new LatestStore();
    relay.register((records) => {
      store.update(records);
    });
    return store;
  });
