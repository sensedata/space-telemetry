// @vitest-environment jsdom
import {expect, test} from "vitest";

import type {CellProps} from "../../src/client/cell-props.ts";
import type {ChannelName} from "../../src/contract/channels.ts";
import {meanChannels} from "../../src/server/mean-channels.ts";
import {pageCells} from "./test-helpers/page-cells.ts";

function channelsMarkedAtMean({source, marker}: CellProps): ChannelName[] {
  if (marker !== undefined) {
    return [];
  }

  switch (source.kind) {
    case "channel": {
      return [source.channel];
    }
    case "average":
    case "deviation":
    case "sum": {
      return [...source.channels];
    }
    // The client marks these at the mean of their own values (withHeldMean), so they read
    // no channel's mean.
    case "angle-deviation":
    case "power":
    case "roll":
    case "pitch":
    case "yaw": {
      return [];
    }
  }
}

test("sends a mean of exactly the channels a bullet chart of index.html marks at it", () => {
  const marked = new Set(
    pageCells(".bullet-chart").flatMap((props) => channelsMarkedAtMean(props)),
  );

  expect(meanChannels).toStrictEqual(marked);
});
