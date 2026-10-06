import {Store} from "./store.ts";

// Whether the event stream is lost: from an error until the stream opens again.
export class ConnectionStore extends Store<{lost: boolean}> {
  constructor() {
    super({lost: false});
  }

  get(): boolean {
    return this.state.lost;
  }
}
