import type {Readable} from "./readable.ts";

export type Signal<Value> = Readable<Value> & {set(value: Value): void};

/** A value that tells its listeners each time it is set. */
export function signal<Value>(initial: Value): Signal<Value> {
  let value = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => value,
    set(next) {
      value = next;
      for (const listener of listeners) {
        listener();
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
