import type {ChannelName} from "../contract/channels.ts";
import {startClock} from "./signals/clock.ts";
import {startStream} from "./start-stream.ts";
import {type CellProps, parseCellProps} from "./cell-props.ts";
import {type CellSource, recordsOf} from "./cell-source.ts";
import {effect} from "./signals/effect.ts";
import {newestRecord} from "./records/newest-record.ts";
import {statusDictionary} from "./status-dictionary.ts";

import {barMicrochart} from "./views/charts/bar-microchart.ts";
import {bulletMicrochart} from "./views/charts/bullet-microchart.ts";
import {sparklineMicrochart} from "./views/charts/sparkline-microchart.ts";
import {mount, type View} from "./views/mount.ts";

import {decimalReadout} from "./views/readouts/decimal-readout.ts";
import {integerReadout} from "./views/readouts/integer-readout.ts";
import {groundTimeReadout} from "./views/readouts/ground-time-readout.ts";
import {networkReadout} from "./views/readouts/network-readout.ts";
import {qualifierReadout} from "./views/readouts/qualifier-readout.ts";
import type {Statuses} from "./views/readouts/status-text.ts";
import {textReadout} from "./views/readouts/text-readout.ts";
import {timestampReadout} from "./views/readouts/timestamp-readout.ts";
import {transmissionDelayReadout} from "./views/readouts/transmission-delay-readout.ts";

const clock = startClock();
const stream = startStream(clock);

type CellSize = {readonly width: number; readonly height: number};

// Each chart, by the selector of its cells: from the props the cell's data attributes give,
// the chart at a size. The props are read once, and the chart drawn at each size the cell
// takes, so a chart drawn again reads the sources it had.
const charts: Record<string, (props: CellProps) => (size: CellSize) => View> = {
  ".bar-chart": ({source, min, max}) => {
    if (min === undefined || max === undefined) {
      throw new TypeError("a bar chart cell names its data-min and data-max");
    }

    const store = recordsOf(source, stream.channels);
    return ({width, height}) => barMicrochart({clock, store, min, max, width, height});
  },
  ".bullet-chart": ({source, capacityId, capacity, marker, conversion}) => {
    const store = recordsOf(source, stream.channels);
    const capacityStore =
      capacityId === undefined ? undefined : stream.channels[capacityId];
    return ({width, height}) =>
      bulletMicrochart({
        store,
        capacityStore,
        capacity,
        marker,
        conversion,
        width,
        height,
      });
  },
  ".sparkline-chart": ({source}) => {
    const store = recordsOf(source, stream.channels);
    return ({width, height}) => sparklineMicrochart({clock, store, width, height});
  },
};

// Each readout, by the selector of its cells, from the props the cell's data attributes give.
const readouts: Record<string, (props: CellProps) => View> = {
  ".readout.decimal": ({source, conversion, scale, negativePad}) =>
    decimalReadout({
      store: recordsOf(source, stream.channels),
      conversion,
      scale,
      negativePad,
    }),
  ".readout.integer": ({source}) => integerReadout(recordsOf(source, stream.channels)),
  ".readout.qualifier": ({source}) =>
    qualifierReadout({
      store: recordsOf(source, stream.channels),
      statuses: statusesOf(source),
    }),
  ".readout.text": ({source}) =>
    textReadout({
      store: recordsOf(source, stream.channels),
      statuses: statusesOf(source),
    }),
  ".readout.timestamp": ({source}) =>
    timestampReadout(recordsOf(source, stream.channels)),
};

// A status cell names one channel, and the status dictionary has its table.
function statusesOf(source: CellSource): Statuses {
  if (source.kind !== "channel") {
    throw new TypeError(`a status cell names one channel, not a ${source.kind}`);
  }
  return statusTable(source.channel);
}

function statusTable(channel: ChannelName): Statuses {
  const statuses = statusDictionary[channel];
  if (statuses === undefined) {
    throw new TypeError(`the status dictionary has no table for ${channel}`);
  }
  return statuses;
}

// The content box of a cell the observer reports. A chart drawn to the padding or border box
// grows its cell by the padding, and with it the row and column. WebKit reports a table
// cell's content box without the row's height, so the box is cut from the border box.
function contentSize(entry: ResizeObserverEntry): CellSize {
  const style = getComputedStyle(entry.target);
  const px = (...properties: string[]) =>
    properties.reduce(
      // eslint-disable-next-line unicorn/prefer-number-coercion -- a computed length reads "8px", which Number makes NaN
      (sum, property) => sum + Number.parseFloat(style.getPropertyValue(property)),
      0,
    );
  const [box] = entry.borderBoxSize;
  if (box === undefined) {
    throw new TypeError("a resize entry reports no border box");
  }
  return {
    width:
      box.inlineSize -
      px("padding-left", "padding-right", "border-left-width", "border-right-width"),
    height:
      box.blockSize -
      px("padding-top", "padding-bottom", "border-top-width", "border-bottom-width"),
  };
}

function pageElement(selector: string): Element {
  const element = document.querySelector(selector);
  if (element === null) {
    throw new TypeError(`the page has no element ${selector}`);
  }
  return element;
}

// Mounts the chart at the cell's content box, now and afresh at each box the cell takes,
// in place of the chart drawn to the last; a cell with no box, as one hidden, shows no
// chart. A chart drawn can widen the cells beside it in a table laid out by content, below
// 768px; the observer then reports those too, and WebKit warns on its console of a loop
// when it carries them over to the next frame.
function mountAtEachSize(cell: Element, chartAt: (size: CellSize) => View): void {
  let unmount: (() => void) | undefined;
  new ResizeObserver((entries) => {
    for (const entry of entries) {
      unmount?.();
      const size = contentSize(entry);
      unmount =
        size.width > 0 && size.height > 0 ? mount(chartAt(size), cell) : undefined;
    }
  }).observe(cell);
}

type TelemetryCell = {readonly cell: Element; readonly props: CellProps};

// The cells of the selector that name telemetry, each with its props.
function telemetryCells(selector: string): TelemetryCell[] {
  return [...document.querySelectorAll(selector)].flatMap((cell) => {
    const props = parseCellProps(cell);
    return props === undefined ? [] : [{cell, props}];
  });
}

for (const [selector, chart] of Object.entries(charts)) {
  for (const {cell, props} of telemetryCells(selector)) {
    mountAtEachSize(cell, chart(props));
  }
}

for (const [selector, readout] of Object.entries(readouts)) {
  for (const {cell, props} of telemetryCells(selector)) {
    mount(readout(props), cell);
  }
}

for (const light of document.querySelectorAll(".status")) {
  const props = parseCellProps(light);
  if (props?.source.kind !== "channel" || props.statusOnValue === undefined) {
    throw new TypeError("a status light names one channel and its data-status-on-value");
  }
  const onValue = props.statusOnValue;
  const store = stream.channels[props.source.channel];
  // A light whose channel holds no record reads off; the page's styles collapse an off
  // gyroscope's details.
  effect([store], () => {
    const latest = newestRecord(store.get());
    light.classList.toggle("on", latest?.v === onValue);
    light.classList.toggle("off", !light.classList.contains("on"));
  });
}

mount(
  networkReadout({
    connection: stream.connection,
    store: stream.channels.STATUS,
    statuses: statusTable("STATUS"),
  }),
  pageElement("#telemetry-network"),
);

mount(timestampReadout(stream.lastTransmission), pageElement("#telemetry-transmitted"));

mount(
  transmissionDelayReadout({clock, store: stream.lastTransmission}),
  pageElement("#telemetry-delay"),
);

mount(groundTimeReadout(clock), pageElement("#ground-time"));
