import {test as base} from "vitest";

import {Relay} from "../../relay.ts";
import {SimpleStore} from "../simple-store.ts";

// store holds up to 3 of the records relay carries.
export const test = base
  .extend("relay", () => new Relay())
  .extend("store", ({relay}) => new SimpleStore(relay, {maxSize: 3}));
