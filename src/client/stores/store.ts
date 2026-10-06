// A state that tells its listeners each time it changes.
// eslint-disable-next-line no-restricted-syntax -- the state and its listeners change over the store's life and every store extends this base, and a class is the honest shape for them
export class Store<State extends object> {
  #state: State;
  readonly #listeners = new Set<() => void>();

  constructor(state: State) {
    this.#state = state;
  }

  protected get state(): State {
    return this.#state;
  }

  setState(patch: Partial<State>): void {
    this.#state = {...this.#state, ...patch};
    for (const listener of this.#listeners) {
      listener();
    }
  }

  // Returns the function that unsubscribes the listener.
  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  listenerCount(): number {
    return this.#listeners.size;
  }
}
