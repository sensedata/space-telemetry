/**
 * Formats milliseconds as hh:mm:ss with total hours, not wrapped at a day. The milliseconds
 * drop toward zero, and a negative duration takes one leading sign.
 */
export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(Math.abs(milliseconds) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = totalSeconds % 60;

  const sign = milliseconds < 0 ? "-" : "";
  const fields = [hours, minutes, seconds].map((field) => String(field).padStart(2, "0"));
  return sign + fields.join(":");
}
