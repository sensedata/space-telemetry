import {useLayoutEffect, useState} from "preact/hooks";

// Anything a view can bind to: a Store, or the Clock.
export type Readable<Snapshot> = {
  get(): Snapshot;
  subscribe(listener: () => void): () => void;
};

/**
 * A view's current snapshot of readable, rendering the view again each time it changes; with
 * no readable, undefined.
 */
export function useStore<Snapshot>(readable: Readable<Snapshot>): Snapshot;
export function useStore<Snapshot>(
  readable: Readable<Snapshot> | undefined,
): Snapshot | undefined;
export function useStore<Snapshot>(
  readable: Readable<Snapshot> | undefined,
): Snapshot | undefined {
  const [, setRenders] = useState(0);
  // A layout effect runs in the render's own task, so no change lands between the render's
  // read and the subscription; a plain effect waits for the paint.
  useLayoutEffect(
    () =>
      readable?.subscribe(() => {
        setRenders((renders) => renders + 1);
      }),
    [readable],
  );

  return readable?.get();
}
