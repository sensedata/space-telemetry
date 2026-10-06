import {unixNow} from "./views/unix-now.ts";

// The current Unix second, telling its listeners each second. It keeps a timer only while
// something listens, so an unmounted view leaves nothing running.
// eslint-disable-next-line no-restricted-syntax -- the listener set and the timer change as views subscribe and leave, and a class is the honest shape for them
export class Clock {
  readonly #listeners = new Set<() => void>();
  #timer: ReturnType<typeof setInterval> | undefined;

  get(): number {
    return unixNow();
  }

  // Returns the function that unsubscribes the listener.
  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    this.#timer ??= setInterval(() => {
      for (const each of this.#listeners) {
        each();
      }
    }, 1000);

    return () => {
      this.#listeners.delete(listener);
      if (this.#listeners.size > 0) {
        return;
      }

      clearInterval(this.#timer);
      this.#timer = undefined;
    };
  }
}
