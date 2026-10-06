import type {TimedRecord} from "./timed-record.ts";

export type Handler = (records: readonly TimedRecord[]) => void;

// Relays the records of a channel's event to every store registered for the channel.
// eslint-disable-next-line no-restricted-syntax -- the handler list grows as stores register over the page's life, and a class is the honest shape for it
export class Relay {
  readonly #handlers: Handler[] = [];

  register(handler: Handler): void {
    this.#handlers.push(handler);
  }

  send(records: readonly TimedRecord[]): void {
    for (const handler of this.#handlers) {
      handler(records);
    }
  }
}
