import {describe, expect, vi} from "vitest";
import * as channels from "../contract/channels.ts";
import type {FeedRecord} from "./feed-record.ts";
import type {FakeLightstreamer} from "./test-helpers/lightstreamer-client.ts";
import {test} from "./test-helpers/lightstreamer-feed.ts";

function feedTimeStatus(feed: FakeLightstreamer, statusClass: string) {
  feed.update("TIME_000001", {"Status.Class": statusClass});
}

// USLAB000059 is channel 237.
function telemetryArrives(feed: FakeLightstreamer, records: readonly FeedRecord[]) {
  feed.update("USLAB000059", {
    TimeStamp: "6131.3858334",
    Value: "23.26046371459961",
    "Status.Class": "24",
    CalibratedData: "23.3",
  });
  return records.some((record) => record.k === 237);
}

describe("connection", () => {
  test("connects to the ISSLIVE adapter set on push.lightstreamer.com", ({feed}) => {
    const [client] = feed.clients;

    expect([client?.serverAddress, client?.adapterSet]).to.deep.equal([
      "https://push.lightstreamer.com",
      "ISSLIVE",
    ]);
  });

  test("subscribes the status class of TIME_000001 in MERGE mode", ({feed}) => {
    const time = feed.subscriptions.find(
      (subscription) => subscription.items.length === 1,
    );

    expect([time?.mode, time?.items, time?.fields]).to.deep.equal([
      "MERGE",
      ["TIME_000001"],
      ["Status.Class"],
    ]);
  });

  test("subscribes telemetry for the carried channels but STATUS in MERGE mode with the fields a record carries", ({
    feed,
  }) => {
    const telemetry = feed.subscriptions.find(
      (subscription) => subscription.items.length > 1,
    );

    expect([telemetry?.mode, telemetry?.items, telemetry?.fields]).to.deep.equal([
      "MERGE",
      channels.carried.filter((name) => name !== "STATUS"),
      ["TimeStamp", "Value", "Status.Class", "CalibratedData"],
    ]);
  });
});

describe("telemetry follows the time status", () => {
  test("streams telemetry once the time status is 24", ({feed, records}) => {
    feedTimeStatus(feed, "24");

    expect(telemetryArrives(feed, records)).to.equal(true);
  });

  test("streams no telemetry while the time status has not been 24", ({
    feed,
    records,
  }) => {
    feedTimeStatus(feed, "0");

    expect(telemetryArrives(feed, records)).to.equal(false);
  });

  test.for([
    ["still streams telemetry 9999 ms after the time status leaves 24", 9999, true],
    ["stops telemetry 10000 ms after the time status leaves 24", 10_000, false],
  ] as const)("%s", ([, elapsed, streaming], {feed, records}) => {
    feedTimeStatus(feed, "24");
    feedTimeStatus(feed, "0");

    vi.advanceTimersByTime(elapsed);

    expect(telemetryArrives(feed, records)).to.equal(streaming);
  });

  test("keeps telemetry when the time status returns to 24 within 10 s", ({
    feed,
    records,
  }) => {
    feedTimeStatus(feed, "24");
    feedTimeStatus(feed, "0");
    vi.advanceTimersByTime(5000);
    feedTimeStatus(feed, "24");

    vi.advanceTimersByTime(10_000);

    expect(telemetryArrives(feed, records)).to.equal(true);
  });

  test("keeps telemetry when the time status changes twice before returning to 24 within 10 s", ({
    feed,
    records,
  }) => {
    feedTimeStatus(feed, "24");
    feedTimeStatus(feed, "0");
    feedTimeStatus(feed, "2");
    feedTimeStatus(feed, "24");

    vi.advanceTimersByTime(10_000);

    expect(telemetryArrives(feed, records)).to.equal(true);
  });

  test("holds telemetry back after a lost session until the time status is 24 again", ({
    feed,
    records,
  }) => {
    feedTimeStatus(feed, "24");

    feed.loseSession();
    feed.restoreSession();

    expect(telemetryArrives(feed, records)).to.equal(false);
  });
});

describe("feed status", () => {
  test("reports the feed disconnected 15 s after a connection status change without a time record", ({
    feed,
    records,
  }) => {
    feed.changeStatus("CONNECTING");

    vi.advanceTimersByTime(15_000);

    expect(records.map((record) => [record.k, record.v, record.s])).to.deep.equal([
      [297, 0, 2],
    ]);
  });
});

describe("records", () => {
  test("emits a feed update as a record of channel, value, calibrated value, unix time, status class and session id", ({
    feed,
    records,
  }) => {
    vi.setSystemTime(new Date("2026-09-12T11:20:00Z"));
    feedTimeStatus(feed, "24");
    vi.setSystemTime(new Date("2026-09-12T11:23:09Z"));

    feed.update("USLAB000059", {
      TimeStamp: "6131.3858334",
      Value: "23.26046371459961",
      "Status.Class": "9",
      CalibratedData: "23.3",
    });

    expect(records.at(-1)).to.deep.equal({
      k: 237,
      v: 23.26046371459961,
      cv: "23.3",
      t: 1_789_212_189,
      s: 9,
      sid: 1_789_212_000_000,
    });
  });

  test("reads a missing value, time stamp and status class as NaN", ({feed, records}) => {
    feedTimeStatus(feed, "24");

    feed.update("USLAB000059", {CalibratedData: "23.3"});

    const record = records.at(-1);
    expect([record?.v, record?.t, record?.s]).to.deep.equal([NaN, NaN, NaN]);
  });

  test("reads a zero value and status class as 0", ({feed, records}) => {
    feedTimeStatus(feed, "24");

    feed.update("USLAB000059", {Value: "0", "Status.Class": "0"});

    const record = records.at(-1);
    expect([record?.v, record?.s]).to.deep.equal([0, 0]);
  });

  test.for([
    ["reads an empty value, time stamp and status class as NaN", ""],
    ["reads a whitespace value, time stamp and status class as NaN", "  "],
    ["reads a value, time stamp and status class with trailing text as NaN", "12abc"],
  ] as const)("%s", ([, text], {feed, records}) => {
    feedTimeStatus(feed, "24");

    feed.update("USLAB000059", {
      TimeStamp: text,
      Value: text,
      "Status.Class": text,
      CalibratedData: "23.3",
    });

    const record = records.at(-1);
    expect([record?.v, record?.t, record?.s]).to.deep.equal([NaN, NaN, NaN]);
  });

  test("gives TIME_000001 its own unix time as its value", ({feed, records}) => {
    vi.setSystemTime(new Date("2026-09-12T11:18:04Z"));
    feedTimeStatus(feed, "24");

    // Estimated: the feed's raw Value for TIME_000001 is not captured.
    feed.update("TIME_000001", {
      TimeStamp: "6131.30111112",
      Value: "6131.30111112",
      "Status.Class": "24",
      CalibratedData: "255/11:18:04",
    });

    const time = records.findLast((record) => record.k === 296);
    expect([time?.v, time?.t]).to.deep.equal([1_789_211_884, 1_789_211_884]);
  });

  test("stamps every record of a telemetry subscription with the millisecond it began, and a later subscription with its own", ({
    feed,
    records,
  }) => {
    vi.setSystemTime(new Date("2026-09-12T11:20:00.250Z"));
    feedTimeStatus(feed, "24");
    telemetryArrives(feed, records);
    vi.advanceTimersByTime(1000);
    telemetryArrives(feed, records);
    feedTimeStatus(feed, "0");
    vi.advanceTimersByTime(10_000);
    vi.setSystemTime(new Date("2026-09-12T11:30:00.750Z"));
    feedTimeStatus(feed, "24");

    telemetryArrives(feed, records);

    expect(
      records.filter((record) => record.k === 237).map((record) => record.sid),
    ).to.deep.equal([1_789_212_000_250, 1_789_212_000_250, 1_789_212_600_750]);
  });
});

describe("listener failures", () => {
  test("reports a telemetry update whose handling throws and handles the next", ({
    feed,
    source,
    records,
  }) => {
    const failure = new Error("consumer failed");
    source.on("data", (record) => {
      if (record.cv === "rejected") {
        throw failure;
      }
    });
    const error = vi.spyOn(console, "error").mockReturnValue(undefined);
    feedTimeStatus(feed, "24");

    feed.update("USLAB000059", {CalibratedData: "rejected"});
    feed.update("USLAB000059", {CalibratedData: "23.3"});

    expect([records.at(-1)?.cv, error.mock.calls]).to.deep.equal([
      "23.3",
      [["lightstreamer %s failed:", "telemetry onItemUpdate", failure]],
    ]);
  });
});
