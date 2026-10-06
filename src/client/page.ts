import {type ComponentChild, h, render} from "preact";

import * as channels from "../contract/channels.ts";
import {App} from "./app.ts";
import {type CellProps, type CellSource, parseCellProps} from "./cell-props.ts";

import {BarMicrochart} from "./views/charts/bar-microchart.tsx";
import {BulletMicrochart} from "./views/charts/bullet-microchart.tsx";
import {SparklineMicrochart} from "./views/charts/sparkline-microchart.tsx";

import {DecimalReadout} from "./views/readouts/decimal-readout.tsx";
import {IntegerReadout} from "./views/readouts/integer-readout.tsx";
import {LastTransmissionReadout} from "./views/readouts/last-transmission-readout.tsx";
import {LocalTimeReadout} from "./views/readouts/local-time-readout.tsx";
import {NetworkReadout} from "./views/readouts/network-readout.tsx";
import {QualifierReadout} from "./views/readouts/qualifier-readout.tsx";
import {TextReadout} from "./views/readouts/text-readout.tsx";
import {TimestampReadout} from "./views/readouts/timestamp-readout.tsx";
import {TransmissionDelayReadout} from "./views/readouts/transmission-delay-readout.tsx";

const app = new App();

type CellSize = {readonly width: number; readonly height: number};

// Each chart, by the selector of its cells, from the props the cell's data attributes give
// and the cell's size. A chart drawn can widen its table's columns, so each cell is measured
// after the cells of the classes before it are drawn.
const charts: Record<string, (props: CellProps, size: CellSize) => ComponentChild> = {
  ".bar-chart": ({source, min, max}, {width, height}) =>
    h(BarMicrochart, {store: recordsOf(source), min, max, width, height}),
  ".bullet-chart": (
    {source, capacityId, capacity, marker, conversion},
    {width, height},
  ) =>
    h(BulletMicrochart, {
      store: recordsOf(source),
      capacityStore:
        capacityId === undefined ? undefined : app.getSimpleStore(capacityId),
      capacity,
      marker,
      conversion,
      width,
      height,
    }),
  ".sparkline-chart": ({source}, {width, height}) =>
    h(SparklineMicrochart, {
      clock: app.clock,
      store: recordsOf(source),
      width,
      height,
    }),
};

// Each readout, by the selector of its cells, from the props the cell's data attributes give.
const readouts: Record<string, (props: CellProps) => ComponentChild> = {
  ".readout.decimal": ({source, conversion, scale, negativePad}) =>
    h(DecimalReadout, {
      ...(source.kind === "quaternion"
        ? {
            store: app.getQuaternionStore(source.quaternionId, source.axes),
            eulerAxis: source.eulerAxis,
          }
        : {store: recordsOf(source)}),
      conversion,
      scale,
      negativePad,
    }),
  ".readout.integer": ({source}) => h(IntegerReadout, {store: recordsOf(source)}),
  ".readout.qualifier": ({source}) =>
    h(QualifierReadout, {
      store: recordsOf(source),
      telemetryNumber:
        source.kind === "channel" ? channels.numbers[source.channel] : undefined,
    }),
  ".readout.text": ({source}) =>
    h(TextReadout, {
      store: recordsOf(source),
      telemetryNumber:
        source.kind === "channel" ? channels.numbers[source.channel] : undefined,
    }),
  ".readout.timestamp": ({source}) => h(TimestampReadout, {store: recordsOf(source)}),
};

// Throws for a quaternion, whose store holds an attitude rather than records.
function recordsOf(source: CellSource) {
  switch (source.kind) {
    case "channel": {
      return app.getSimpleStore(source.channel);
    }
    case "average": {
      return app.getAveragingStore(source.channels);
    }
    case "angle-deviation": {
      return app.getAngleDeviationStore(source.angles);
    }
    case "deviation": {
      return app.getDeviationStore(source.channels);
    }
    case "sum": {
      return app.getSummingStore(source.channels);
    }
    case "power": {
      return app.getPowerStore(source.pairs);
    }
    case "quaternion": {
      throw new TypeError(
        `quaternion ${source.quaternionId} is on a cell that shows records`,
      );
    }
  }
}

// The cell's content box: a chart drawn to the padding or border box grows its cell by the
// padding, and with it the row and column.
function contentSize(cell: Element): CellSize {
  const box = cell.getBoundingClientRect();
  const style = getComputedStyle(cell);
  const px = (...properties: string[]) =>
    properties.reduce(
      // eslint-disable-next-line unicorn/prefer-number-coercion -- a computed length reads "8px", which Number makes NaN
      (sum, property) => sum + Number.parseFloat(style.getPropertyValue(property)),
      0,
    );
  return {
    width:
      box.width -
      px("padding-left", "padding-right", "border-left-width", "border-right-width"),
    height:
      box.height -
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

// Charts are drawn to their cells' sizes, so a resized window draws them afresh. Each is
// first emptied, as at load, so that no chart holds its column at the old width.
function drawCharts() {
  for (const selector of Object.keys(charts)) {
    for (const cell of document.querySelectorAll(selector)) {
      render(undefined, cell);
    }
  }
  for (const [selector, chart] of Object.entries(charts)) {
    for (const cell of document.querySelectorAll(selector)) {
      const props = parseCellProps(cell);
      if (props !== undefined) {
        render(chart(props, contentSize(cell)), cell);
      }
    }
  }
}

drawCharts();
// A browser fires resize at most once a frame.
addEventListener("resize", drawCharts);

for (const [selector, readout] of Object.entries(readouts)) {
  for (const cell of document.querySelectorAll(selector)) {
    const props = parseCellProps(cell);
    if (props !== undefined) {
      render(readout(props), cell);
    }
  }
}

for (const light of document.querySelectorAll(".status")) {
  const props = parseCellProps(light);
  if (props?.source.kind !== "channel" || props.statusOnValue === undefined) {
    throw new TypeError("a status light names one channel and its data-status-on-value");
  }
  const onValue = props.statusOnValue;
  const store = app.getLatestStore(props.source.channel);
  // A light whose channel holds no record reads off; the page's styles collapse an off
  // gyroscope's details.
  const paint = () => {
    const [latest] = store.get();
    light.classList.toggle("on", latest?.v === onValue);
    light.classList.toggle("off", !light.classList.contains("on"));
  };
  paint();
  store.subscribe(paint);
}

render(
  h(NetworkReadout, {
    connection: app.connection,
    store: app.getSimpleStore("STATUS"),
    telemetryNumber: channels.numbers.STATUS,
  }),
  pageElement("#telemetry-network"),
);

render(
  h(LastTransmissionReadout, {store: app.lastTransmission}),
  pageElement("#telemetry-transmitted"),
);

render(
  h(TransmissionDelayReadout, {clock: app.clock, store: app.lastTransmission}),
  pageElement("#telemetry-delay"),
);

render(h(LocalTimeReadout, {clock: app.clock}), pageElement("#local-time"));

// Last: a store asked for once the stream is open throws.
app.connect();
