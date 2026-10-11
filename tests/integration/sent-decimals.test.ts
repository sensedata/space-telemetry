// @vitest-environment jsdom
import {expect, test} from "vitest";

import type {CellProps} from "../../src/client/cell-props.ts";
import type {ChannelName} from "../../src/contract/channels.ts";
import {sentDecimals} from "../../src/server/sent-decimals.ts";
import {pageCells} from "./test-helpers/page-cells.ts";

type Need = {readonly channel: ChannelName; readonly needs: number};

function decimalsOf(scale: number, conversion: number): number {
  const exponent = scale + Math.log10(conversion);
  return Number.isSafeInteger(exponent) && exponent >= 0
    ? exponent
    : 2 - Math.floor(Math.log10(10 ** -scale / conversion));
}

function needsOf({source, scale, conversion = 1}: CellProps): Need[] {
  if (scale === undefined) {
    throw new TypeError("a decimal cell with no data-scale shows every digit");
  }

  const decimals = decimalsOf(scale, conversion);
  switch (source.kind) {
    case "channel": {
      return [{channel: source.channel, needs: decimals}];
    }
    case "sum": {
      return source.channels.map((channel) => ({channel, needs: decimals + 1}));
    }
    case "average":
    case "deviation": {
      return source.channels.map((channel) => ({channel, needs: decimals}));
    }
    case "angle-deviation": {
      return source.angles.map(({channel}) => ({channel, needs: decimals}));
    }
    // sent-decimals.ts takes a quaternion's decimals from a recording, not from the cell.
    case "roll":
    case "pitch":
    case "yaw": {
      return [];
    }
    case "power": {
      throw new TypeError(
        "sent-decimals.ts states no rule for the channels of a power cell",
      );
    }
  }
}

test("sends each channel the decimals every decimal cell of index.html needs of it", () => {
  const shortfalls = pageCells(".readout.decimal").flatMap((props) =>
    needsOf(props)
      .filter(({channel, needs}) => sentDecimals[channel] < needs)
      .map((need) => ({
        ...need,
        cell: props.source.kind,
        sends: sentDecimals[need.channel],
      })),
  );

  expect(shortfalls).toStrictEqual([]);
});
