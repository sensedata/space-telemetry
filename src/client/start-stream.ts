import type {ChannelName} from "../contract/channels.ts";
import * as channels from "../contract/channels.ts";
import {lastTransmission} from "./records/last-transmission.ts";
import {mergeRecords} from "./records/merge-records.ts";
import {derived} from "./signals/derived.ts";
import type {Readable} from "./signals/readable.ts";
import {type Signal, signal} from "./signals/signal.ts";
import {parseTimedRecords, type TimedRecord} from "./timed-record.ts";

const FIRST_BACKOFF_MS = 1000;
const LAST_BACKOFF_MS = 30_000;

// The server pings every 15 seconds; twice that lets one ping run late without a reconnect.
const SILENCE_MS = 30_000;

// Each channel's records, oldest first.
export type Channels = Readonly<Record<ChannelName, Readable<readonly TimedRecord[]>>>;

// The server's event stream as the page reads it.
export type Stream = {
  readonly channels: Channels;
  // Whether the event stream is lost: from an error until the stream opens again.
  readonly connection: Readable<boolean>;
  // Of the station channels only: the times of the feed's clock and of the server's own
  // STATUS say nothing of when an instrument last reported.
  readonly lastTransmission: Readable<readonly TimedRecord[]>;
  // Closes the stream and stops reopening it.
  close(): void;
};

/**
 * Opens the /events stream of the origin, empty for the page's own, and fills a signal per
 * channel with the records it carries. Reopens the stream after a backoff when the server
 * refuses it, and when it falls silent for SILENCE_MS. The clock, in Unix seconds, is read
 * to judge a record's time credible.
 */
export function startStream(clock: Readable<number>, origin = ""): Stream {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Object.fromEntries types its keys as string; names gives every ChannelName its entry.
  const stores = Object.fromEntries(
    channels.names.map((name) => [name, signal<readonly TimedRecord[]>([])]),
  ) as Readonly<Record<ChannelName, Signal<readonly TimedRecord[]>>>;
  const connection = signal(false);

  let backoffMs = FIRST_BACKOFF_MS;
  let events: EventSource | undefined;
  let reconnect: ReturnType<typeof setTimeout> | undefined;
  // A proxy can hold a stream open after the server behind it has gone, or accept a
  // connection it never answers, and EventSource reports neither, so a stream silent for
  // SILENCE_MS is dropped.
  let watchdog: ReturnType<typeof setTimeout> | undefined;

  function connect(): void {
    const opened = (events = new EventSource(`${origin}/events`));
    const reconnectLater = () => {
      clearTimeout(watchdog);
      reconnect = setTimeout(connect, backoffMs);
      backoffMs = Math.min(backoffMs * 2, LAST_BACKOFF_MS);
    };

    const resetWatchdog = () => {
      clearTimeout(watchdog);
      watchdog = setTimeout(() => {
        opened.close();
        connection.set(true);
        reconnectLater();
      }, SILENCE_MS);
    };
    resetWatchdog();

    // EventSource hands a message event its data as a string.
    opened.addEventListener("records", (message: MessageEvent<string>) => {
      const byChannel = Map.groupBy(
        parseTimedRecords(message.data),
        (record) => record.k,
      );
      for (const [name, records] of byChannel) {
        const store = stores[name];
        store.set(mergeRecords(store.get(), records));
      }
    });
    opened.addEventListener("records", resetWatchdog);
    opened.addEventListener("ping", resetWatchdog);
    opened.addEventListener("open", () => {
      backoffMs = FIRST_BACKOFF_MS;
      connection.set(false);
      resetWatchdog();
    });

    // EventSource retries a dropped connection by itself but gives up for good on an answer
    // other than 200 with text/event-stream, such as a proxy's 502 while the server restarts.
    opened.addEventListener("error", () => {
      connection.set(true);
      if (opened.readyState === EventSource.CLOSED) {
        reconnectLater();
      }
    });
  }

  connect();

  return {
    channels: stores,
    connection,
    lastTransmission: derived(
      channels.names
        .filter((name) => name !== "TIME_000001" && name !== "STATUS")
        .map((name) => stores[name]),
      (stations) => lastTransmission(stations, clock.get()),
    ),
    close() {
      clearTimeout(reconnect);
      clearTimeout(watchdog);
      events?.close();
    },
  };
}
