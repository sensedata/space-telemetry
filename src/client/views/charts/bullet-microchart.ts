import {newestRecord} from "../../records/newest-record.ts";
import type {Reading, TimedRecord} from "../../timed-record.ts";
import type {Readable} from "../../signals/readable.ts";
import type {View} from "../mount.ts";
import {svgElement} from "../svg-element.ts";
import {linearScale} from "./linear-scale.ts";

type BulletMicrochartProps = {
  store: Readable<readonly Reading[]>;
  // A capacity channel's newest value takes the place of capacity.
  capacityStore?: Readable<readonly Reading[]> | undefined;
  // capacity and marker are in converted units.
  capacity?: number | undefined;
  marker?: number | undefined;
  // conversion scales the measure and the mean marker from the channel's units. The
  // channel mean marks the chart where no marker is given.
  conversion?: number | undefined;
  width: number;
  height: number;
};

/**
 * A channel's newest value as a bar against its capacity, with a reference marker; empty
 * until the channel holds a record and the capacity is known.
 */
export function bulletMicrochart({
  store,
  capacityStore,
  capacity,
  marker,
  conversion,
  width,
  height,
}: BulletMicrochartProps): View {
  // The chart shows a reading's magnitude: a negative reading draws its size against
  // capacity.
  const converted = (raw: number) => Math.abs(raw) * (conversion ?? 1);

  return {
    sources: capacityStore === undefined ? [store] : [store, capacityStore],
    draw() {
      const measure = newestRecord(store.get());
      const full =
        capacityStore === undefined
          ? capacity
          : capacityOf(newestRecord(capacityStore.get()));
      if (measure === undefined || full === undefined) {
        return;
      }

      const scale = linearScale({min: 0, max: full}, width);
      const markerAt = scale(marker ?? converted(measure.vm));
      const measureAt = scale(converted(measure.v ?? 0));

      // The ranges are quarters of capacity: the stream record carries no standard
      // deviation to size them.
      const range = (n: number, fraction: number) =>
        svgElement("rect", {
          class: `range-${n}`,
          x: 0,
          y: 0,
          width: scale(full * fraction),
          height,
        });

      return svgElement(
        "svg",
        {
          role: "img",
          "aria-label": "Newest value against capacity, with a reference marker",
          width,
          height,
        },
        [
          range(3, 1),
          range(2, 0.75),
          range(1, 0.5),
          range(0, 0.25),
          svgElement("line", {
            class: "measure",
            x1: 0,
            x2: measureAt,
            y1: height * 0.5,
            y2: height * 0.5,
          }),
          svgElement("line", {
            class: "marker",
            x1: markerAt,
            x2: markerAt,
            y1: height * 0.15,
            y2: height * 0.85,
          }),
        ],
      );
    },
  };
}

// A capacity record without a value counts as 0, as linearScale counts a value it lacks.
function capacityOf(record: Pick<TimedRecord, "v"> | undefined): number | undefined {
  return record === undefined ? undefined : (record.v ?? 0);
}
