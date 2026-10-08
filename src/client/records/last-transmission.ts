import type {TimedRecord} from "../timed-record.ts";
import {newestRecord} from "./newest-record.ts";

const DELAY_ERROR_MARGIN = 60;

/**
 * The newest record of any of the channels, as a one-record array, empty when no record is
 * credible. Some Lightstreamer data is timestamped far in the future, so a record more than
 * DELAY_ERROR_MARGIN seconds ahead of now is not credible; now and each record's t are
 * Unix seconds.
 */
export function lastTransmission(
  channels: readonly (readonly TimedRecord[])[],
  now: number,
): readonly TimedRecord[] {
  const latestCredible = now + DELAY_ERROR_MARGIN;
  const credible = channels.flat().filter((record) => record.t <= latestCredible);
  const newest = newestRecord(credible);
  return newest === undefined ? [] : [newest];
}
