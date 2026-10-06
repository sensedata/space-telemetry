import type {FeedRecord} from "../feed-record.ts";
import {start} from "../lightstreamer.ts";
import {createSource} from "../source.ts";
import {test as fakeClockTest} from "./fake-clock.ts";
import {createFakeLightstreamer} from "./lightstreamer-client.ts";

// Each test of this `test` starts an adapter of its own, over a fresh fake Lightstreamer and
// into a fresh source. feed is the fake, source is the source, and records collects what the
// source emits. The fake clock of fake-clock.ts runs under every test.
export const test = fakeClockTest
  .extend("started", () => {
    const feed = createFakeLightstreamer();
    const source = createSource();
    const records: FeedRecord[] = [];
    source.on("data", (record) => {
      records.push(record);
    });
    start(feed.module, source);
    return {feed, source, records};
  })
  .extend("feed", ({started}) => started.feed)
  .extend("source", ({started}) => started.source)
  .extend("records", ({started}) => started.records);
