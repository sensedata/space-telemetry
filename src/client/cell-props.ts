import type {ChannelName} from "../contract/channels.ts";
import * as channels from "../contract/channels.ts";
import {type CellSource, type Combination, COMBINATIONS} from "./cell-source.ts";
import type {MirroredAngle} from "./records/angle-deviation.ts";
import type {PowerPair} from "./records/power.ts";

type NumberProp =
  | "capacity"
  | "conversion"
  | "marker"
  | "max"
  | "min"
  | "scale"
  | "statusOnValue";

export type CellProps = {
  readonly source: CellSource;
  readonly capacityId?: ChannelName;
  readonly negativePad?: boolean;
} & Readonly<Partial<Record<NumberProp, number>>>;

const NUMBER_ATTRIBUTES: readonly {
  readonly prop: NumberProp;
  readonly attribute: string;
}[] = [
  {prop: "capacity", attribute: "data-capacity"},
  {prop: "conversion", attribute: "data-conversion"},
  {prop: "marker", attribute: "data-marker"},
  {prop: "max", attribute: "data-max"},
  {prop: "min", attribute: "data-min"},
  {prop: "scale", attribute: "data-scale"},
  {prop: "statusOnValue", attribute: "data-status-on-value"},
];

const KNOWN_ATTRIBUTES = new Set([
  // The page's markup and styles read these; no view does.
  "class",
  "colspan",
  "id",
  "title",
  "data-capacity-id",
  "data-combine",
  "data-negative-pad",
  "data-telemetry-id",
  "data-telemetry-ids",
  ...NUMBER_ATTRIBUTES.map(({attribute}) => attribute),
]);

// The server sends the channels of the data dictionary alone, so a cell naming another
// would show nothing.
function channelOf(text: string): ChannelName {
  const channel = channels.names.find((name) => name === text);
  if (channel === undefined) {
    throw new RangeError(`no carried telemetry channel ${JSON.stringify(text)}`);
  }
  return channel;
}

// A power cell names each supply as its volts channel, "*", and its amps channel.
function pairOf(text: string): PowerPair<ChannelName> {
  const [volts, amps, ...rest] = text.split("*");
  if (volts === undefined || amps === undefined || rest.length > 0) {
    throw new TypeError(`${JSON.stringify(text)} is not a volts*amps pair of channels`);
  }
  return {volts: channelOf(volts), amps: channelOf(amps)};
}

// In an angle deviation cell, a channel may carry a prefix that says how its sensor is
// mounted: "-" when it counts the other way round, "180+" when it starts half a turn away,
// and "180-" when both. The channel name follows the prefix, as in "180-P4000007".
function mirroredAngleOf(text: string): MirroredAngle<ChannelName> {
  const mounting = ["180-", "180+", "-"].find((prefix) => text.startsWith(prefix)) ?? "";
  return {
    channel: channelOf(text.slice(mounting.length)),
    negated: mounting.endsWith("-"),
    turned: mounting.startsWith("180"),
  };
}

function combinationOf(text: string | undefined): Combination {
  const combination = COMBINATIONS.find((name) => name === text);
  if (combination === undefined) {
    throw new TypeError(
      `data-combine="${String(text)}" is not angle-deviation, power or ${COMBINATIONS.join(", ")}`,
    );
  }
  return combination;
}

function numberAt(cell: Element, attribute: string): number | undefined {
  const text = cell.getAttribute(attribute);
  if (text === null) {
    return undefined;
  }
  const value = Number(text);
  if (text.trim() === "" || Number.isNaN(value)) {
    throw new TypeError(`${attribute}="${text}" is not a number`);
  }
  return value;
}

function flagAt(cell: Element, attribute: string): boolean | undefined {
  const text = cell.getAttribute(attribute);
  if (text !== null && text !== "true" && text !== "false") {
    throw new TypeError(`${attribute}="${text}" is neither true nor false`);
  }
  return text === null ? undefined : text === "true";
}

function sourceOf(cell: Element): CellSource {
  const channel = cell.getAttribute("data-telemetry-id");
  if (channel !== null) {
    return {kind: "channel", channel: channelOf(channel)};
  }

  const channels = cell.getAttribute("data-telemetry-ids");
  if (channels !== null) {
    const combine = cell.getAttribute("data-combine") ?? undefined;
    if (combine === "angle-deviation") {
      return {
        kind: "angle-deviation",
        angles: channels.split(",").map((angle) => mirroredAngleOf(angle)),
      };
    }
    if (combine === "power") {
      return {kind: "power", pairs: channels.split(",").map((pair) => pairOf(pair))};
    }
    return {
      kind: combinationOf(combine),
      channels: channels.split(",").map((name) => channelOf(name)),
    };
  }

  throw new TypeError("a telemetry cell with data attributes names no channel");
}

/**
 * Returns a telemetry cell's data attrs into a new CellProps.
 */
export function parseCellProps(cell: Element): CellProps | undefined {
  const names = cell.getAttributeNames();
  const unknown = names.find((name) => !KNOWN_ATTRIBUTES.has(name));
  if (unknown !== undefined) {
    throw new TypeError(`${unknown} is not an attribute of a telemetry cell`);
  }
  if (names.every((name) => !name.startsWith("data-"))) {
    return undefined;
  }

  const numbers: Partial<Record<NumberProp, number>> = {};
  for (const {prop, attribute} of NUMBER_ATTRIBUTES) {
    const value = numberAt(cell, attribute);
    if (value !== undefined) {
      numbers[prop] = value;
    }
  }
  const capacityId = cell.getAttribute("data-capacity-id");
  const negativePad = flagAt(cell, "data-negative-pad");
  return {
    source: sourceOf(cell),
    ...numbers,
    ...(capacityId !== null && {capacityId: channelOf(capacityId)}),
    ...(negativePad !== undefined && {negativePad}),
  };
}
