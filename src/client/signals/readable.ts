export type Readable<Value> = {
  get(): Value;
  /** Returns the function that unsubscribes the listener. */
  subscribe(listener: () => void): () => void;
};
