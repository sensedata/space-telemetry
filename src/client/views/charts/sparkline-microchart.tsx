import type {VNode} from "preact";
import {useMemo} from "preact/hooks";

import type {TimedRecord} from "../../timed-record.ts";
import {type Readable, useStore} from "../use-store.ts";
import {chartWindow} from "./chart-window.ts";
import {linearScale} from "./linear-scale.ts";
import {sparklinePath} from "./sparkline-path.ts";
import {valueExtent} from "./value-extent.ts";

type SparklineMicrochartProps = {
  clock: Readable<number>;
  store: Readable<readonly Pick<TimedRecord, "t" | "v">[]>;
  width: number;
  height: number;
};

/**
 * Recent values of a channel as a line over time with the newest circled, empty until one
 * has a value.
 */
export function SparklineMicrochart({
  clock,
  store,
  width,
  height,
}: SparklineMicrochartProps): VNode | undefined {
  const now = useStore(clock);
  const records = useStore(store);
  // The window's points stay where the records or the width last placed them; each second
  // moves only the scales under them, so a silent channel's newest point drifts left.
  const timeWindow = useMemo(() => chartWindow(records, width, now), [records, width]);

  // With no record, or none with a value, y has no domain, so the chart draws nothing.
  const extent = valueExtent(timeWindow.records);
  const newest = timeWindow.records.at(-1);
  if (extent === undefined || newest === undefined) {
    return undefined;
  }

  // To keep the current circle inside the bounds, the chart is translated up
  // and over 2 and should be kept 2 away from the top and right edges of its
  // container.
  const x = linearScale({min: now - timeWindow.availablePoints, max: now - 1}, width - 6);
  const y = linearScale(extent, height - 4);

  return (
    <svg
      className="sparkline"
      role="img"
      aria-label="Recent values over time, newest circled"
      height={height}
      width={width}
    >
      <g transform="translate(2,2)">
        <rect
          className="qualitative"
          x="0"
          y={height * 0.3}
          width={width - 1.5}
          height={height * 0.4}
        ></rect>
        <path d={sparklinePath(timeWindow.records, x, y)}></path>
        <circle cx={x(newest.t)} cy={y(newest.v)} r="1.5"></circle>
      </g>
    </svg>
  );
}
