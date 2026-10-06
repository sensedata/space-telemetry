import {test as base} from "vitest";

// Opens `url`'s /events with Node's EventSource, as the page does. next(name) resolves
// with the data, parsed as JSON, of the next event of that name, so it is called before
// the event can arrive; it rejects if the stream fails first.
function openEventStream(url: string) {
  const source = new EventSource(url + "/events");
  return {
    source,
    next: (name: string) =>
      new Promise<unknown>((resolve, reject) => {
        source.addEventListener(
          name,
          (event: MessageEvent<string>) => {
            resolve(JSON.parse(event.data));
          },
          {
            once: true,
          },
        );
        source.addEventListener(
          "error",
          () => {
            reject(new Error(url + " /events failed"));
          },
          {once: true},
        );
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
