import {effect} from "../signals/effect.ts";
import type {Readable} from "../signals/readable.ts";

// What a cell shows: a node drawn from its sources, drawn again each time one changes.
export type View = {
  readonly sources: readonly Readable<unknown>[];
  // The node to show now, or undefined for nothing.
  draw(): Node | undefined;
};

/**
 * Shows the view in the container, in place of what it held, and draws it again each time
 * a source changes. Returns the function that stops following the sources and empties the
 * container.
 */
export function mount(view: View, container: Element): () => void {
  const stop = effect(view.sources, () => {
    const node = view.draw();
    container.replaceChildren(...(node === undefined ? [] : [node]));
  });

  return () => {
    stop();
    container.replaceChildren();
  };
}
