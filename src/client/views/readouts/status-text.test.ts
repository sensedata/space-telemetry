import {assert, describe, test} from "vitest";

import {timedRecord} from "../../test-helpers/records.ts";
import {statusText} from "./status-text.ts";

const MODES = {1: "Standard", 2: "Microgravity", 4: "Reboost"};

describe("the status text of a channel's records", () => {
  test("is a dash before any record", () => {
    assert.equal(statusText([], MODES), "-");
  });

  test("names the status of the newest record's value", () => {
    const records = [timedRecord({t: 1, v: 2}), timedRecord({t: 2, v: 4})];

    assert.equal(statusText(records, MODES), "Reboost");
  });

  test("names the status of the later of two records within the same second", () => {
    const records = [timedRecord({t: 10, v: 1}), timedRecord({t: 10, v: 2})];

    assert.equal(statusText(records, MODES), "Microgravity");
  });

  test("is a dash for the 0 a channel sends between statuses that have no 0", () => {
    assert.equal(statusText([timedRecord({t: 0, v: 0})], MODES), "-");
  });

  test("names the status of 0 on a channel that has one", () => {
    assert.equal(
      statusText([timedRecord({t: 0, v: 0})], {0: "LVLH", 1: "J2000"}),
      "LVLH",
    );
  });

  test("is Unknown for a value the channel has no status for", () => {
    assert.equal(statusText([timedRecord({t: 0, v: -1})], MODES), "Unknown");
  });
});
