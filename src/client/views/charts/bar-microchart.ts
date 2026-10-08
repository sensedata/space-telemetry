import type {Reading} from "../../timed-record.ts";
import type {Readable} from "../../signals/readable.ts";
import type {View} from "../mount.ts";
import {svgElement} from "../svg-element.ts";
import {chartWindow, PIXELS_PER_POINT} from "./chart-window.ts";
import {linearScale} from "./linear-scale.ts";
import {recordsInForce} from "./records-in-force.ts";

// The bars draw this far inside the svg on every side, as the sparkline's marks do.
const INSET = 2;
// Each bar leaves a pixel of its point's pitch as the gap before the next.
const BAR_WIDTH = 2;
// A record's bar and the one after it mark its own second; later bars carry it forward.
const REAL_POINT_SECONDS = 2;

type BarMicrochartProps = {
  // Read for the second of a draw, not followed: the bars move only as records arrive.
  clock: Readable<number>;
  store: Readable<readonly Reading[]>;
  // The values at the foot and the top of the chart.
  min: number;
  max: number;
  width: number;
  height: number;
};

/** Recent values of a channel as one bar per second, empty until it holds a record. */
export function barMicrochart({
  clock,
  store,
  min,
  max,
  width,
  height,
}: BarMicrochartProps): View {
  return {
    sources: [store],
    draw() {
      const records = store.get();
      if (records.length === 0) {
        return;
      }

      const timeWindow = chartWindow(records, width - 2 * INSET, clock.get());
      const drawableHeight = height - 2 * INSET;
      const barHeight = linearScale({min, max}, drawableHeight);

      // A value outside min to max draws as the bar at the nearer edge.
      const bar = (record: Reading, second: number) => {
        const visible = Math.min(Math.max(barHeight(record.v), 0), drawableHeight);
        // withLeftPoint moves the time of the record in force at earliest, so whether a bar
        // is real comes from the times the store holds.
        const at = timeWindow.earliest + second;
        const real = records.some(
          (held) => held.t <= at && at - held.t < REAL_POINT_SECONDS,
        );

        return svgElement("rect", {
          class: real ? "bar real-point" : "bar",
          x: second * PIXELS_PER_POINT,
          y: drawableHeight - visible,
          width: BAR_WIDTH,
          height: visible,
        });
      };

      const bars = recordsInForce(
        timeWindow.records,
        timeWindow.earliest,
        timeWindow.availablePoints,
      ).map((record, second) => bar(record, second));

      return svgElement(
        "svg",
        {
          role: "img",
          "aria-label": "Recent values, one bar per second",
          height,
          width,
        },
        [svgElement("g", {transform: `translate(${INSET},${INSET})`}, bars)],
      );
    },
  };
}
