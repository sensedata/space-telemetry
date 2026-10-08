/** Formats a Unix time in seconds as its UTC time and date, as HH:mm:ss yyyy.MM.dd. */
export function formatUtcTime(unixTime: number): string {
  const iso = new Date(unixTime * 1000).toISOString();
  const date = iso.slice(0, 10).replaceAll("-", ".");
  const time = iso.slice(11, 19);
  return `${time} ${date}`;
}
