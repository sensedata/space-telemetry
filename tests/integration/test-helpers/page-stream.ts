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

// Each test imports page.ts to boot it afresh into index.html's body. setTimeout is faked so
// the stream's 30 s watchdog, which only a reconnect or close() clears, dies with the test.
//
// page.ts's error listener switches off Vitest's jsdom failing the run on an uncaught error,
// so this fixture fails the test on one the test leaves untaken. Window listeners go after
// each test, so an earlier test's page does not act on a later test's document.
export const test = base
  .extend("page", {auto: true}, ({}, {onCleanup}) => {
    const windowListeners = vi.spyOn(globalThis, "addEventListener");

    vi.useFakeTimers({
      toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "Date"],
    });

    FakeResizeObserver.observers.clear();
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    addEventListener("resize", () => {
      for (const observer of FakeResizeObserver.observers) {
        observer.report();
      }
    });

    const uncaught: unknown[] = [];
    addEventListener("error", (event) => {
      event.preventDefault();
      uncaught.push(event.error);
    });

    onCleanup(() => {
      for (const [type, listener, options] of windowListeners.mock.calls) {
        removeEventListener(type, listener, options);
      }

      vi.useRealTimers();

      if (uncaught.length > 0) {
        throw new AggregateError(
          uncaught,
          "the window reported errors the test did not take",
        );
      }
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

    return {
      stream: (nth = 0): FakeEventSource => {
        const source = sources[nth];

        if (source === undefined) {
          throw new RangeError(
            `the page opened ${sources.length} streams, not ${nth + 1}`,
          );
        }

        return source;
      },
      takeUncaught: () => uncaught.splice(0),
    };
  })
  .extend("stream", ({page}) => page.stream)
  .extend("takeUncaught", ({page}) => page.takeUncaught);
