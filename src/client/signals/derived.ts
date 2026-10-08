import type {Readable} from "./readable.ts";
import {signal} from "./signal.ts";

/**
 * Computed again each time a source changes and held between changes, so a reader sees
 * one value until the next.
 */
export function derived<Source, Value>(
  sources: readonly Readable<Source>[],
  compute: (values: readonly Source[]) => Value,
): Readable<Value> {
  const read = () => compute(sources.map((source) => source.get()));
  const value = signal(read());

  for (const source of sources) {
    source.subscribe(() => {
      value.set(read());
    });
  }

  return value;
}
