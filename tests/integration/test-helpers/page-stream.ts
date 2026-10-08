import fs from "node:fs";
import path from "node:path";
import {test as base, vi} from "vitest";

import type {StreamEvent} from "../../../src/contract/stream-event.ts";

// Stands in for the network: each stream the page opens, which the test opens and feeds.
class FakeEventSource extends EventTarget {
  static CLOSED = 2;

  readonly url: string;

  constructor(url: string) {
    super();
    this.url = url;
  }

  open() {
    this.dispatchEvent(new Event("open"));
  }

  send({name, data}: StreamEvent) {
    this.dispatchEvent(new MessageEvent(name, {data: JSON.stringify(data)}));
  }

  close() {
    // The fake holds no connection, and no test reads whether the page closed it.
  }
}

type BorderBoxEntry = Pick<ResizeObserverEntry, "target" | "borderBoxSize">;

// Stands in for layout, which jsdom has none of: each cell observed is reported its
// getBoundingClientRect as its border box, on observe and again at each resize event of the
// window, so a test sizes cells by mocking getBoundingClientRect.
// eslint-disable-next-line no-restricted-syntax -- the page constructs it with new, as it does the platform's
class FakeResizeObserver {
  static readonly observers = new Set<FakeResizeObserver>();

  readonly #callback: (entries: BorderBoxEntry[]) => void;
  readonly #targets = new Set<Element>();

  constructor(callback: (entries: BorderBoxEntry[]) => void) {
    this.#callback = callback;
    FakeResizeObserver.observers.add(this);
  }

  observe(target: Element) {
    this.#targets.add(target);
    this.report([target]);
  }

  report(targets: Iterable<Element> = this.#targets) {
    const entries = [...targets].map((target) => {
      const {width, height} = target.getBoundingClientRect();
      return {target, borderBoxSize: [{inlineSize: width, blockSize: height}]};
    });
    if (entries.length > 0) {
      this.#callback(entries);
    }
  }
}

// Each test of this `test` starts with index.html's body in the document, a fake EventSource
// in place of the real one, a fake ResizeObserver, and no module loaded, so that it boots the
// page afresh by importing page.ts. stream(nth) is the nth stream the page opened. Every test
// runs on fake timers that move only as the test advances them: the fakes of fake-clock.ts,
// and setTimeout and clearTimeout with them, so that the stream's 30 s watchdog timeout,
// which only a reconnect or close() clears, goes with the fakes instead of outliving the test.
export const test = base.extend("stream", {auto: true}, ({}, {onCleanup}) => {
  vi.useFakeTimers({
    toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "Date"],
  });
  FakeResizeObserver.observers.clear();
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  const reportSizes = () => {
    for (const observer of FakeResizeObserver.observers) {
      observer.report();
    }
  };
  addEventListener("resize", reportSizes);
  onCleanup(() => {
    removeEventListener("resize", reportSizes);
    vi.useRealTimers();
  });
  const html = fs.readFileSync(
    path.join(import.meta.dirname, "..", "..", "..", "src", "client", "index.html"),
    "utf8",
  );
  document.body.replaceChildren(
    ...new DOMParser().parseFromString(html, "text/html").body.childNodes,
  );
  const sources: FakeEventSource[] = [];
  vi.stubGlobal(
    "EventSource",
    class extends FakeEventSource {
      constructor(url: string) {
        super(url);
        sources.push(this);
      }
    },
  );
  vi.resetModules();
  return (nth = 0): FakeEventSource => {
    const source = sources[nth];
    if (source === undefined) {
      throw new RangeError(`the page opened ${sources.length} streams, not ${nth + 1}`);
    }
    return source;
  };
});
