import {assert, vi} from "vitest";
import type {FeedRecord} from "./feed-record.ts";
import {createSource} from "./source.ts";
import {test} from "./test-helpers/fake-clock.ts";

test("stamps a STATUS record with the millisecond as its session id and the second as its time", () => {
  const source = createSource();
  const records: FeedRecord[] = [];
  source.on("data", (record) => {
    records.push(record);
  });
  vi.setSystemTime(new Date("2026-09-12T11:20:00.250Z"));

  source.reportDisconnected();

  assert.deepEqual(
    records.map(({sid, t}) => ({sid, t})),
    [{sid: 1_789_212_000_250, t: 1_789_212_000}],
  );
});

test("emits its own STATUS record, and none of another source in the same process", () => {
  const other = createSource();
  const source = createSource();
  const records: FeedRecord[] = [];
  source.on("data", (record) => {
    records.push(record);
  });
  vi.setSystemTime(new Date("2026-09-12T11:20:00Z"));
  other.reportDisconnected();
  vi.setSystemTime(new Date("2026-09-12T11:30:00Z"));

  source.reportDisconnected();

  assert.deepEqual(
    records.map(({t}) => t),
    [1_789_212_600],
  );
});
