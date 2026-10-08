import type {RequestListener} from "node:http";

import {assert, describe, vi} from "vitest";
import type {Readable} from "../../src/client/signals/readable.ts";
import {streamRecord, timedRecord} from "../../src/client/test-helpers/records.ts";
import type {StreamRecord} from "../../src/contract/stream-record.ts";
import {test} from "./test-helpers/served-stream.ts";

function changed(store: Pick<Readable<unknown>, "subscribe">): Promise<void> {
  return new Promise((resolve) => store.subscribe(resolve));
}

// Answers the first request 503, and each later one with a stream that sends `records` as a
// records event.
function unavailableOnce(records: readonly StreamRecord[]): RequestListener {
  let requests = 0;
  return (_req, res) => {
    requests += 1;
    if (requests === 1) {
      res.writeHead(503).end();
      return;
    }
    res.writeHead(200, {"Content-Type": "text/event-stream"});
    res.write(`event: records\ndata: ${JSON.stringify(records)}\n\n`);
  };
}

describe("the stream against a server", () => {
  test("reopens the stream after the server answers 503", async ({serveStream}) => {
    vi.useFakeTimers({toFake: ["setTimeout", "clearTimeout"]});
    const stream = await serveStream(
      unavailableOnce([
        streamRecord({k: "AIRLOCK000001", v: 7, t: 1_790_560_000, s: 24}),
      ]),
    );
    const store = stream.channels.AIRLOCK000001;
    await changed(stream.connection);

    vi.advanceTimersByTime(1000);
    await changed(store);

    assert.deepEqual(store.get(), [
      timedRecord({k: "AIRLOCK000001", v: 7, t: 1_790_560_000, s: 24}),
    ]);
  });

  test("reports the stream lost while it reconnects and found once it reopens", async ({
    serveStream,
  }) => {
    // Ends every stream at once and has EventSource reopen it after 10 ms.
    const stream = await serveStream((_req, res) => {
      res.writeHead(200, {"Content-Type": "text/event-stream"}).end("retry: 10\n\n");
    });
    const states: boolean[] = [];
    const reopened = new Promise<void>((resolve) =>
      stream.connection.subscribe(() => {
        states.push(stream.connection.get());
        if (states.length === 3) {
          resolve();
        }
      }),
    );
    await reopened;

    assert.deepEqual(states, [false, true, false]);
  });
});
