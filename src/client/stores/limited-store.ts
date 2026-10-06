import {Store} from "./store.ts";

export type LimitedStoreProps = {readonly maxSize?: number};

// Holds the last maxSize records it is given, one unless props say otherwise and never fewer.
export class LimitedStore<Held> extends Store<{data: readonly Held[]}> {
  readonly #maxSize: number;

  constructor(props?: LimitedStoreProps) {
    super({data: []});

    // prune's slice(-0) keeps every item, so 0 is held as 1.
    this.#maxSize = Math.max(1, props?.maxSize ?? 1);
  }

  get(): readonly Held[] {
    return this.state.data;
  }

  protected prune<Item>(items: readonly Item[]): Item[] {
    return items.slice(-this.#maxSize);
  }

  update(data: readonly Held[]): void {
    this.setState({data: this.prune(data)});
  }
}
