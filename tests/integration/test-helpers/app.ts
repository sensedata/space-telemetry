import {once} from "node:events";
import http, {type RequestListener} from "node:http";
import {test as base, vi} from "vitest";

import {App} from "../../../src/client/app.ts";
import type {StreamEvent} from "../../../src/contract/stream-event.ts";
import {listeningPort} from "../../../src/server/listening-port.ts";

// Stands in for the network: each test opens, refuses, drops or feeds the streams App makes.
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

// sources holds, in the order App opened them, the FakeEventSources that stand in for
// EventSource during the test, and sourceAt(index) is one of them. app is an App on a fake
// setTimeout, clearTimeout and Date, which start at `now` and move only as the test advances
// them; `now` is the real time unless `test.override({ now })` sets it for a describe. It
// closes after the test. serveApp(handler) starts a server of its own with `handler` on a
// free port and resolves with an App at its origin; after the test the App closes, the
// server closes with its connections, and real timers, which such a test may fake, return.
export const test = base
  .extend("sources", () => {
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
      throw new RangeError(`App opened no stream ${index}`);
    }
    return source;
  })
  .extend("now", () => Date.now())
  .extend("app", ({now}, {onCleanup}) => {
    vi.useFakeTimers({toFake: ["setTimeout", "clearTimeout", "Date"], now});
    const app = new App();
    onCleanup(() => {
      app.close();
      vi.useRealTimers();
    });
    return app;
  })
  .extend("serveApp", ({}, {onCleanup}) => {
    const served: {server: http.Server; app: App}[] = [];
    onCleanup(() => {
      for (const {server, app} of served) {
        app.close();
        server.closeAllConnections();
        server.close();
      }
      vi.useRealTimers();
    });
    return async (handler: RequestListener) => {
      const server = http.createServer(handler).listen(0);
      await once(server, "listening");
      // By address: resolving localhost can stall for a test's whole timeout.
      const app = new App(`http://127.0.0.1:${listeningPort(server)}`);
      served.push({server, app});
      return app;
    };
  });
