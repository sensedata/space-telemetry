import {decimalText} from "../contract/decimal-text.ts";
import {sentDecimals} from "./sent-decimals.ts";

const decimalsByChannel = new Map<string, number>(Object.entries(sentDecimals));

/** Throws a RangeError for a channel outside the data dictionary. */
export function roundToSentDecimals(k: string, v: number): number {
  const decimals = decimalsByChannel.get(k);
  if (decimals === undefined) {
    throw new RangeError(`no channel ${k} in the data dictionary`);
  }

  return Number(decimalText(v, decimals));
}
