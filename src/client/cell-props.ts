import type {CarriedName} from "../contract/channels.ts";
import * as channels from "../contract/channels.ts";
import type {MirroredAngle} from "./stores/angle-deviation-store.ts";
import type {PowerPair} from "./stores/power-store.ts";
import type {Axis} from "./stores/quaternion-store.ts";

// Where a cell's records come from.
export type CellSource =
  | {readonly kind: "channel"; readonly channel: CarriedName}
  | {
      readonly kind: "average" | "deviation" | "sum";
      readonly channels: readonly CarriedName[];
    }
  | {
      readonly kind: "angle-deviation";
      readonly angles: readonly MirroredAngle<CarriedName>[];
    }
  | {readonly kind: "power"; readonly pairs: readonly PowerPair<CarriedName>[]}
  | {
      readonly kind: "quaternion";
      readonly quaternionId: string;
      readonly eulerAxis: Exclude<Axis, "w">;
      readonly axes: Readonly<Record<Axis, CarriedName>>;
    };

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
  readonly capacityId?: CarriedName;
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
  "data-euler-axis",
  "data-negative-pad",
  "data-quaternion-id",
  "data-telemetry-id",
  "data-telemetry-ids",
  "data-telemetry-id-w",
  "data-telemetry-id-x",
  "data-telemetry-id-y",
  "data-telemetry-id-z",
  ...NUMBER_ATTRIBUTES.map(({attribute}) => attribute),
]);

// The server sends the carried channels alone, so a cell naming another would show nothing.
function channelOf(text: string): CarriedName {
  const channel = channels.carried.find((name) => name === text);
  if (channel === undefined) {
    throw new RangeError(`no carried telemetry channel ${JSON.stringify(text)}`);
  }
  return channel;
}

function channelAt(cell: Element, attribute: string): CarriedName {
  const text = cell.getAttribute(attribute);
  if (text === null) {
    throw new TypeError(`a quaternion cell lacks ${attribute}`);
  }
  return channelOf(text);
}

// A power cell names each supply as its volts channel, "*", and its amps channel.
function pairOf(text: string): PowerPair<CarriedName> {
  const [volts, amps, ...rest] = text.split("*");
  if (volts === undefined || amps === undefined || rest.length > 0) {
    throw new TypeError(`${JSON.stringify(text)} is not a volts*amps pair of channels`);
  }
  return {volts: channelOf(volts), amps: channelOf(amps)};
}

// An angle deviation cell names each channel behind how its mounting mirrors the plain
// one: "-" for negated, "180+" for turned, "180-" for both.
function mirroredAngleOf(text: string): MirroredAngle<CarriedName> {
  const mounting = ["180-", "180+", "-"].find((prefix) => text.startsWith(prefix)) ?? "";
  return {
    channel: channelOf(text.slice(mounting.length)),
    negated: mounting.endsWith("-"),
    turned: mounting.startsWith("180"),
  };
}

function eulerAxisAt(cell: Element): Exclude<Axis, "w"> {
  const text = cell.getAttribute("data-euler-axis");
  if (text !== "x" && text !== "y" && text !== "z") {
    throw new TypeError(`data-euler-axis="${String(text)}" is not x, y or z`);
  }
  return text;
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
  const quaternionId = cell.getAttribute("data-quaternion-id");
  if (quaternionId !== null) {
    return {
      kind: "quaternion",
      quaternionId,
      eulerAxis: eulerAxisAt(cell),
      axes: {
        x: channelAt(cell, "data-telemetry-id-x"),
        y: channelAt(cell, "data-telemetry-id-y"),
        z: channelAt(cell, "data-telemetry-id-z"),
        w: channelAt(cell, "data-telemetry-id-w"),
      },
    };
  }

  const channel = cell.getAttribute("data-telemetry-id");
  if (channel !== null) {
    return {kind: "channel", channel: channelOf(channel)};
  }
  const channels = cell.getAttribute("data-telemetry-ids");
  if (channels !== null) {
    const combine = cell.getAttribute("data-combine");
    if (combine === "angle-deviation") {
      return {
        kind: "angle-deviation",
        angles: channels.split(",").map((angle) => mirroredAngleOf(angle)),
      };
    }
    if (combine === "power") {
      return {kind: "power", pairs: channels.split(",").map((pair) => pairOf(pair))};
    }
    if (combine !== "average" && combine !== "deviation" && combine !== "sum") {
      throw new TypeError(
        `data-combine="${String(combine)}" is not angle-deviation, average, deviation, power or sum`,
      );
    }
    return {
      kind: combine,
      channels: channels.split(",").map((name) => channelOf(name)),
    };
  }
  throw new TypeError("a telemetry cell with data attributes names no channel");
}

/**
 * The props a cell's data attributes give its view, or undefined for a cell with none,
 * which the page fills itself. Throws on an attribute no view reads, so a misspelt one
 * fails the page rather than go unread.
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
