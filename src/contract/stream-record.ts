// A record as an /events event carries it to the client.
export type StreamRecord = {
  // The channel's name in the data dictionary.
  readonly k: string;

  // JSON writes NaN as null, and the server's Lightstreamer adapter reads a missing Value
  // or TimeStamp as NaN.
  readonly v: number | null; // Value, rounded to the decimals the page needs of it.
  readonly t: number | null; // Time, in Unix seconds.

  // Status class. Never null: the server's buffer stores no record whose status class is
  // NaN.
  readonly s: number;

  // Value mean, rounded as the value is. The server computes it over the values it holds
  // for the channel, and sends it only for the channels of src/server/mean-channels.ts.
  readonly vm?: number;
};
