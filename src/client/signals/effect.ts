import type {Readable} from "./readable.ts";

/**
 * Runs run now, and again each time a source changes. Returns the function that stops
 * following the sources.
 */
export function effect(
  sources: readonly Readable<unknown>[],
  run: () => void,
): () => void {
  run();
  const unsubscribes = sources.map((source) => source.subscribe(run));

  return () => {
    for (const unsubscribe of unsubscribes) {
      unsubscribe();
    }
  };
}
