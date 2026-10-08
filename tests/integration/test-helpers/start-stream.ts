import {test as base, vi} from "vitest";

import {signal} from "../../../src/client/signals/signal.ts";
import {startStream} from "../../../src/client/start-stream.ts";
import type {StreamEvent} from "../../../src/contract/stream-event.ts";

// Stands in for the network: each test opens, refuses, drops or feeds the streams startStream opens.
class FakeEventSource extends EventTarget {
  static CLOSED = 2;

  readonly url: string;
  readonly openedAt = Date.now();
  readyState = 0;

  constructor(url: string) {
    super();
    this.url = url;
  }

  open() {
    this.readyState = 1;
    this.dispatchEvent(new Event("open"));
  }

  // As EventSource does for an answer other than 200 with text/event-stream.
  refuse() {
    this.readyState = FakeEventSource.CLOSED;
    this.dispatchEvent(new Event("error"));
  }

  // As EventSource does when an open stream ends and it reconnects by itself.
  drop() {
    this.readyState = 0;
    this.dispatchEvent(new Event("error"));
  }

  send({name, data}: StreamEvent) {
    this.dispatchEvent(new MessageEvent(name, {data: JSON.stringify(data)}));
  }

  close() {
    this.readyState = FakeEventSource.CLOSED;
  }
}

// Every test of this `test` runs a stream started on a fake EventSource and a fake
// setTimeout, clearTimeout and Date, which start at `now` and move only as the test
// advances them; `now` is the real
// time unless `test.override({ now })` sets it for a describe. The stream closes after the
// test. sources holds, in the order the stream opened them, the FakeEventSources that
// stand in for EventSource during the test, sourceAt(index) is one of them, and stream is
// the Stream.
export const test = base
  .extend("sources", {auto: true}, () => {
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
    return sources;
  })
  .extend("sourceAt", ({sources}) => (index: number) => {
    const source = sources[index];
    if (source === undefined) {
      throw new RangeError(`the stream opened no source ${index}`);
    }
    return source;
  })
  .extend("now", () => Date.now())
  .extend("stream", {auto: true}, ({now}, {onCleanup}) => {
    vi.useFakeTimers({toFake: ["setTimeout", "clearTimeout", "Date"], now});
    const stream = startStream(signal(Math.floor(now / 1000)));
    onCleanup(() => {
      stream.close();
      vi.useRealTimers();
    });
    return stream;
  });
