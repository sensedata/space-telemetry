import type {VNode} from "preact";
import {useMemo} from "preact/hooks";

import type {TimedRecord} from "../../timed-record.ts";
import {unixNow} from "../unix-now.ts";
import {type Readable, useStore} from "../use-store.ts";
import {chartWindow} from "./chart-window.ts";
import {linearScale} from "./linear-scale.ts";
import {recordsInForce} from "./records-in-force.ts";
import {valueBounds} from "./value-bounds.ts";

type BarMicrochartProps = {
  store: Readable<readonly Pick<TimedRecord, "t" | "v">[]>;
  // The values at the foot and the top of the chart, the records' own where not given.
  min?: number | undefined;
  max?: number | undefined;
  width: number;
  height: number;
};

/** Recent values of a channel as one bar per second, empty until it holds a record. */
export function BarMicrochart({
  store,
  min,
  max,
  width,
  height,
}: BarMicrochartProps): VNode | undefined {
  const records = useStore(store);
  // The window ends at the second of the render that brought the records or the width.
  const timeWindow = useMemo(
    () => chartWindow(records, width, unixNow()),
    [records, width],
  );

  if (records.length === 0) {
    return undefined;
  }

  const bounds = valueBounds(timeWindow.records);
  const y = linearScale({min: min ?? bounds.min, max: max ?? bounds.max}, height);

  const bars = recordsInForce(
    timeWindow.records,
    timeWindow.earliest,
    timeWindow.availablePoints,
  ).map((record, n) => {
    // The window's left point puts a record in force at each of its seconds.
    if (record === undefined) {
      throw new RangeError(`no record in force ${n} seconds into the window`);
    }
    const className = timeWindow.earliest + n - record.t < 2 ? "bar real-point" : "bar";

    return (
      <rect
        key={n}
        className={className}
        x={n * 3}
        y={height - y(record.v)}
        width="2"
        height={y(record.v)}
      ></rect>
    );
  });

  return (
    <svg
      className="bars"
      role="img"
      aria-label="Recent values, one bar per second"
      height={height}
      width={width}
    >
      <g transform="translate(2,2)">{bars}</g>
    </svg>
  );
}
