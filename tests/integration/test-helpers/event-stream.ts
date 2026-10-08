import {test as base} from "vitest";

// The records of `channel` among `data`, an event's records as the stream carries them.
export function recordsOf(data: unknown, channel: string): unknown[] {
  if (!Array.isArray(data)) {
    throw new TypeError("the event data is not an array of records");
  }
  return data.filter(
    (record: unknown) =>
      typeof record === "object" &&
      record !== null &&
      Reflect.get(record, "k") === channel,
  );
}

// Opens `url`'s /events with Node's EventSource, as the page does. Each wait below is
// called before the event can arrive, and rejects if the stream fails first. next(name)
// resolves with the data, parsed as JSON, of the next event of that name. backfill(channel)
// resolves with the records of `channel` in the next records event: on a stream just
// opened, its backfill. live(channel) resolves with the records of `channel` in the next
// records event that holds any.
function openEventStream(url: string) {
  const source = new EventSource(url + "/events");

  function until<T>(name: string, settle: (data: unknown) => T | undefined) {
    return new Promise<T>((resolve, reject) => {
      const listener = (event: MessageEvent<string>) => {
        const result = settle(JSON.parse(event.data));
        if (result === undefined) {
          return;
        }

        source.removeEventListener(name, listener);
        resolve(result);
      };
      source.addEventListener(name, listener);
      source.addEventListener(
        "error",
        () => {
          reject(new Error(url + " /events failed"));
        },
        {once: true},
      );
    });
  }

  return {
    source,
    next: (name: string) => until(name, (data) => data),
    backfill: (channel: string) => until("records", (data) => recordsOf(data, channel)),
    live: (channel: string) =>
      until("records", (data) => {
        const records = recordsOf(data, channel);
        return records.length > 0 ? records : undefined;
      }),
    close: () => {
      source.close();
    },
  };
}

export type EventStream = ReturnType<typeof openEventStream>;

// openStream(url) opens an event stream as openEventStream does, closed after the test.
export const test = base.extend("openStream", ({}, {onCleanup}) => {
  const streams: EventStream[] = [];
  onCleanup(() => {
    for (const stream of streams) stream.close();
  });
  return (url: string) => {
    const stream = openEventStream(url);
    streams.push(stream);
    return stream;
  };
});
