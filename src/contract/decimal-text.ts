/** `v` at `decimals` decimals, unifying page and server rounding approach. */
export function decimalText(v: number, decimals: number): string {
  return v.toFixed(decimals);
}
