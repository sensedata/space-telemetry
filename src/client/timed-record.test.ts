import {assert, describe, test} from "vitest";
import {streamRecord, timedRecord} from "./test-helpers/records.ts";
import {parseTimedRecords} from "./timed-record.ts";

describe("parsing an event's records", () => {
  test("drops a record without a time", () => {
    const data = JSON.stringify([
      // eslint-disable-next-line unicorn/no-null -- a stream record carries JSON null for a NaN value or time, as stream-record.ts types it
      streamRecord({v: 1, t: null}),
      streamRecord({v: 2, t: 1_790_560_000}),
    ]);

    assert.deepEqual(parseTimedRecords(data), [timedRecord({v: 2, t: 1_790_560_000})]);
  });

  test("keeps a record without a value, its value undefined", () => {
    // eslint-disable-next-line unicorn/no-null -- a stream record carries JSON null for a NaN value or time, as stream-record.ts types it
    const data = JSON.stringify([streamRecord({v: null, t: 1_790_560_000})]);

    assert.deepEqual(parseTimedRecords(data), [
      timedRecord({v: undefined, t: 1_790_560_000}),
    ]);
  });

  test("refuses a record without a status class", () => {
    const data = '[{"k":237,"v":7,"t":1790560000,"s":null,"vm":7}]';

    assert.throws(() => parseTimedRecords(data), TypeError);
  });

  test("parses an event with no records to none", () => {
    assert.deepEqual(parseTimedRecords("[]"), []);
  });

  test("refuses a record that lacks the value mean the server sends", () => {
    assert.throws(
      () => parseTimedRecords('[{"k":237,"v":7,"t":1790560000,"s":24}]'),
      TypeError,
    );
  });

  test("refuses a record whose status class is text", () => {
    const data = '[{"k":237,"v":7,"t":1790560000,"s":"24","vm":7}]';

    assert.throws(() => parseTimedRecords(data), TypeError);
  });

  test("refuses a record whose value is text", () => {
    const data = '[{"k":237,"v":"7","t":1790560000,"s":24,"vm":7}]';

    assert.throws(() => parseTimedRecords(data), TypeError);
  });

  test("refuses data whose entry is not a record", () => {
    assert.throws(() => parseTimedRecords("[7]"), TypeError);
  });
});
