import type {Reading} from "../../timed-record.ts";
import type {Readable} from "../../signals/readable.ts";
import type {View} from "../mount.ts";
import {svgElement} from "../svg-element.ts";
import {chartWindow} from "./chart-window.ts";
import {linearScale} from "./linear-scale.ts";
import {recordsInForce} from "./records-in-force.ts";
import {valueBounds} from "./value-bounds.ts";

type BarMicrochartProps = {
  // Read for the second of a draw, not followed: the bars move only as records arrive.
  clock: Readable<number>;
  store: Readable<readonly Reading[]>;
  // The values at the foot and the top of the chart, the records' own where not given.
  min?: number | undefined;
  max?: number | undefined;
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

      const timeWindow = chartWindow(records, width, clock.get());
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
        // A record's bar and the one after it mark its own second; later bars carry it
        // forward.
        const className =
          timeWindow.earliest + n - record.t < 2 ? "bar real-point" : "bar";

        return svgElement("rect", {
          class: className,
          x: n * 3,
          y: height - y(record.v),
          width: 2,
          height: y(record.v),
        });
      });

      return svgElement(
        "svg",
        {
          role: "img",
          "aria-label": "Recent values, one bar per second",
          height,
          width,
        },
        [svgElement("g", {transform: "translate(2,2)"}, bars)],
      );
    },
  };
}
