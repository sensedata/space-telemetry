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
  // capacity and marker are in converted units. The reading's mean marks the chart where
  // no marker is given; "none" marks nothing.
  capacity?: number | undefined;
  marker?: number | "none" | undefined;
  // conversion scales the measure and the mean marker from the channel's units.
  conversion?: number | undefined;
  width: number;
  height: number;
};

/**
 * A channel's newest value as a bar against its capacity, with a reference marker; empty
 * until the channel holds a record and the capacity is known. Its draw throws a TypeError
 * when given no marker and the newest record carries no mean.
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
      const measureAt = scale(converted(measure.v ?? 0));
      const markerAt =
        marker === "none" ? undefined : scale(marker ?? converted(meanOf(measure)));

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
          "aria-label":
            markerAt === undefined
              ? "Newest value against capacity"
              : "Newest value against capacity, with a reference marker",
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
          ...(markerAt === undefined
            ? []
            : [
                svgElement("line", {
                  class: "marker",
                  x1: markerAt,
                  x2: markerAt,
                  y1: height * 0.15,
                  y2: height * 0.85,
                }),
              ]),
        ],
      );
    },
  };
}

// A reading lacks vm only where it reads a channel outside src/server/mean-channels.ts,
// whose mean the server does not send; tests/integration/mean-channels.test.ts keeps
// every bullet chart of index.html without a data-marker off such channels. Stays
// beside bulletMicrochart: a file of its own would export a guard no other view reads.
function meanOf({vm}: Pick<Reading, "vm">): number {
  if (vm === undefined) {
    throw new TypeError("a bullet chart with no marker reads records without a mean");
  }
  return vm;
}

// A capacity record without a value counts as 0, as linearScale counts a value it
// lacks. Stays beside bulletMicrochart: a file of its own would export a rule no other
// view reads.
function capacityOf(record: Pick<TimedRecord, "v"> | undefined): number | undefined {
  return record === undefined ? undefined : (record.v ?? 0);
}
