import {DateTime} from "luxon";

/** Formats a Unix time in seconds as its UTC time and date, as HH:mm:ss yyyy.MM.dd. */
export function formatUtcTime(unixTime: number): string {
  return DateTime.fromSeconds(unixTime).toUTC().toFormat("HH:mm:ss yyyy.MM.dd");
}
