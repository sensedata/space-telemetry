import type {Reading} from "../../timed-record.ts";
import type {Readable} from "../../signals/readable.ts";
import type {View} from "../mount.ts";
import {svgElement} from "../svg-element.ts";
import {chartWindow} from "./chart-window.ts";
import {type LinearScale, linearScale} from "./linear-scale.ts";
import {sparklinePath} from "./sparkline-path.ts";
import {valueExtent} from "./value-extent.ts";

type SparklineMicrochartProps = {
  clock: Readable<number>;
  store: Readable<readonly Reading[]>;
  width: number;
  height: number;
};

/**
 * Recent values of a channel as a line over time with the newest circled, empty until one
 * has a value.
 */
export function sparklineMicrochart({
  clock,
  store,
  width,
  height,
}: SparklineMicrochartProps): View {
  // The window's points stay where the records last placed them; each second moves only
  // the x scale under them, so a silent channel's newest point drifts left.
  let placed = store.get();
  let timeWindow = chartWindow(placed, width, clock.get());

  return {
    sources: [clock, store],
    draw() {
      const now = clock.get();
      if (store.get() !== placed) {
        placed = store.get();
        timeWindow = chartWindow(placed, width, now);
      }

      const extent = valueExtent(timeWindow.records);
      const newest = timeWindow.records.at(-1);
      if (extent === undefined || newest === undefined) {
        return;
      }

      // The scales and the translate(2,2) of the g leave a margin of 2 above, below, and
      // left of the line, and of 4 right of it, for the newest point's circle.
      const x = linearScale(
        {min: now - timeWindow.availablePoints, max: now - 1},
        width - 6,
      );
      const drawableHeight = height - 4;
      const heightAboveFoot = linearScale(extent, drawableHeight);
      const y: LinearScale = (value) => drawableHeight - heightAboveFoot(value);

      const qualitative = svgElement("rect", {
        class: "qualitative",
        x: 0,
        y: height * 0.3,
        width: width - 1.5,
        height: height * 0.4,
      });
      const line = svgElement("path", {d: sparklinePath(timeWindow.records, x, y)});
      const dot = svgElement("circle", {cx: x(newest.t), cy: y(newest.v), r: 1.5});

      return svgElement(
        "svg",
        {
          class: "sparkline",
          role: "img",
          "aria-label": "Recent values over time, newest circled",
          height,
          width,
        },
        [svgElement("g", {transform: "translate(2,2)"}, [qualitative, line, dot])],
      );
    },
  };
}
