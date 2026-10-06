import type {VNode} from "preact";

import {newestRecord} from "../../stores/newest-record.ts";
import type {TimedRecord} from "../../timed-record.ts";
import {type Readable, useStore} from "../use-store.ts";
import {linearScale} from "./linear-scale.ts";

type BulletMicrochartProps = {
  store: Readable<readonly Pick<TimedRecord, "t" | "v" | "vm">[]>;
  // A capacity channel's newest value takes the place of capacity.
  capacityStore?: Readable<readonly Pick<TimedRecord, "t" | "v">[]> | undefined;
  // capacity and marker are in converted units.
  capacity?: number | undefined;
  marker?: number | undefined;
  // conversion scales the measure and the mean marker from the channel's units.
  conversion?: number | undefined;
  width: number;
  height: number;
};

/** A channel's newest value as a bar against its capacity, with a reference marker. */
export function BulletMicrochart({
  store,
  capacityStore,
  capacity,
  marker,
  conversion,
  width,
  height,
}: BulletMicrochartProps): VNode | undefined {
  const records = useStore(store);
  const capacityRecords = useStore(capacityStore);
  const measure = newestRecord(records);
  const full =
    capacityRecords === undefined ? capacity : capacityOf(newestRecord(capacityRecords));
  if (measure === undefined || full === undefined) {
    return undefined;
  }

  const scale = linearScale({min: 0, max: full}, width);
  // A conversion of 0 is taken as none.
  const factor = conversion === undefined || conversion === 0 ? 1 : conversion;
  const converted = (raw: number) => Math.abs(raw) * factor;
  // A marker of 0 is taken as none; the channel mean then marks the chart.
  const markerAt = scale(
    marker === undefined || marker === 0 ? converted(measure.vm) : marker,
  );
  const measureAt = scale(converted(measure.v ?? 0));

  return (
    <svg
      className="bullet"
      role="img"
      aria-label="Newest value against capacity, with a reference marker"
      width={width}
      height={height}
    >
      {/* The ranges are quarters of capacity: the stream record carries no standard
          deviation to size them. */}
      <rect className="range-3" x="0" y="0" width={scale(full)} height={height}></rect>
      <rect
        className="range-2"
        x="0"
        y="0"
        width={scale(full * 0.75)}
        height={height}
      ></rect>
      <rect
        className="range-1"
        x="0"
        y="0"
        width={scale(full * 0.5)}
        height={height}
      ></rect>
      <rect
        className="range-0"
        x="0"
        y="0"
        width={scale(full * 0.25)}
        height={height}
      ></rect>

      <line
        className="measure"
        x1="0"
        x2={measureAt}
        y1={height * 0.5}
        y2={height * 0.5}
      ></line>
      <line
        className="marker"
        x1={markerAt}
        x2={markerAt}
        y1={height * 0.15}
        y2={height * 0.85}
      ></line>
    </svg>
  );
}

// A capacity record without a value counts as 0, as a record's value does on the scale.
function capacityOf(record: Pick<TimedRecord, "v"> | undefined): number | undefined {
  return record === undefined ? undefined : (record.v ?? 0);
}
