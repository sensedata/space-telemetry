import type {ChannelName} from "../contract/channels.ts";
import {angleDeviation, type MirroredAngle} from "./records/angle-deviation.ts";
import {attitude} from "./records/attitude.ts";
import {average} from "./records/average.ts";
import type {CombinedRecord} from "./records/combine-by-time.ts";
import {deviation} from "./records/deviation.ts";
import {power, type PowerPair} from "./records/power.ts";
import {sum} from "./records/sum.ts";
import {derived} from "./signals/derived.ts";
import type {Readable} from "./signals/readable.ts";
import type {Channels} from "./start-stream.ts";
import type {Reading, TimedRecord} from "./timed-record.ts";

// The combinations of several channels' records a cell's data-combine can name by itself.
export const COMBINATIONS = [
  "average",
  "deviation",
  "sum",
  "roll",
  "pitch",
  "yaw",
] as const;

export type Combination = (typeof COMBINATIONS)[number];

// Where a cell's records come from.
export type CellSource =
  | {readonly kind: "channel"; readonly channel: ChannelName}
  | {readonly kind: Combination; readonly channels: readonly ChannelName[]}
  | {
      readonly kind: "angle-deviation";
      readonly angles: readonly MirroredAngle<ChannelName>[];
    }
  | {readonly kind: "power"; readonly pairs: readonly PowerPair<ChannelName>[]};

const combinations: Readonly<
  Record<Combination, (channels: readonly (readonly TimedRecord[])[]) => CombinedRecord[]>
> = {
  average,
  deviation,
  sum,
  roll: attitude("x"),
  pitch: attitude("y"),
  yaw: attitude("z"),
};

export function recordsOf(
  source: CellSource,
  channels: Channels,
): Readable<readonly Reading[]> {
  if (source.kind === "channel") {
    return channels[source.channel];
  }

  if (source.kind === "angle-deviation") {
    return derived(
      source.angles.map(({channel}) => channels[channel]),
      (angles) => angleDeviation(angles, source.angles),
    );
  }

  return source.kind === "power"
    ? derived(
        source.pairs.flatMap(({volts, amps}) => [channels[volts], channels[amps]]),
        power,
      )
    : derived(
        source.channels.map((channel) => channels[channel]),
        combinations[source.kind],
      );
}
