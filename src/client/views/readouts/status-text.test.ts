import {assert, describe, test} from "vitest";

import * as channels from "../../../contract/channels.ts";
import {timedRecord} from "../../test-helpers/records.ts";
import {statusText} from "./status-text.ts";

describe("the status text of a channel's records", () => {
  test("is a dash before any record", () => {
    assert.equal(statusText([], channels.numbers.USLAB000086), "-");
  });

  test("names the status of the newest record's value", () => {
    const records = [timedRecord({t: 1, v: 2}), timedRecord({t: 2, v: 4})];

    assert.equal(statusText(records, channels.numbers.USLAB000086), "Reboost");
  });

  test("names the status of the later of two records within the same second", () => {
    const records = [timedRecord({t: 10, v: 1}), timedRecord({t: 10, v: 2})];

    assert.equal(statusText(records, channels.numbers.USLAB000086), "Microgravity");
  });

  test("is a dash for the 0 a channel sends between statuses that have no 0", () => {
    assert.equal(
      statusText([timedRecord({t: 0, v: 0})], channels.numbers.NODE3000004),
      "-",
    );
  });

  test("names the status of 0 on a channel that has one", () => {
    assert.equal(
      statusText([timedRecord({t: 0, v: 0})], channels.numbers.USLAB000017),
      "LVLH",
    );
  });

  test("is Unknown for a value the channel has no status for", () => {
    assert.equal(
      statusText([timedRecord({t: 0, v: -1})], channels.numbers.USLAB000086),
      "Unknown",
    );
  });

  test("is Unknown for a channel without a status dictionary", () => {
    assert.equal(
      statusText([timedRecord({t: 0, v: 4})], channels.numbers.USLAB000059),
      "Unknown",
    );
  });
});
