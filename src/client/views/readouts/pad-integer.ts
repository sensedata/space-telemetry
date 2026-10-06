/**
 * Pads the integer part of a formatted number with leading zeros to precision characters. A
 * negative value's sign counts as one, and the zeros go before it: "0-5.25".
 */
export function padInteger(formatted: string, precision: number): string {
  const integer = String(parseInt(formatted));
  return formatted.startsWith(integer)
    ? `${integer.padStart(precision, "0")}${formatted.slice(integer.length)}`
    : formatted;
}
