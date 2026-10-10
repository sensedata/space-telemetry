import {test as base} from "vitest";

// `data` is an event's records as the stream carries them.
export function recordsOfChannel(data: unknown, channel: string): unknown[] {
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

// Opens `url`'s /events with Node's EventSource, as the page does. EventSource keeps no
// past event, so call each wait below before its event can arrive. A wait rejects if the
// stream fails first or sends an event the wait cannot read. next(name) resolves with the
// data, parsed as JSON, of the next event of that name. backfill(channel) resolves with the
// records of `channel` in the next records event: on a stream just opened, its backfill.
// live(channel) resolves with the records of `channel` in the next records event that
// holds any.
function openEventStream(url: string) {
  const source = new EventSource(url + "/events");

  function until<T>(name: string, settle: (data: unknown) => T | undefined) {
    return new Promise<T>((resolve, reject) => {
      const settled = new AbortController();
      source.addEventListener(
        name,
        (event: MessageEvent<string>) => {
          try {
            const result = settle(JSON.parse(event.data));
            if (result === undefined) {
              return;
            }

            settled.abort();
            resolve(result);
          } catch (error) {
            settled.abort();
            reject(
              new Error(`${url}/events sent an unreadable ${name} event`, {cause: error}),
            );
          }
        },
        {signal: settled.signal},
      );
      source.addEventListener(
        "error",
        () => {
          settled.abort();
          reject(new Error(`${url}/events failed`));
        },
        {signal: settled.signal},
      );
    });
  }

  return {
    source,
    next: (name: string) => until(name, (data) => data),
    backfill: (channel: string) =>
      until("records", (data) => recordsOfChannel(data, channel)),
    live: (channel: string) =>
      until("records", (data) => {
        const records = recordsOfChannel(data, channel);
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
