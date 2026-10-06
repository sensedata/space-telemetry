import {test as base} from "vitest";

import {Relay} from "../../relay.ts";
import {SummingStore} from "../summing-store.ts";

// store sums relay1 and relay2, and holds up to 100 points.
export const test = base
  .extend("relay1", () => new Relay())
  .extend("relay2", () => new Relay())
  .extend(
    "store",
    ({relay1, relay2}) => new SummingStore([relay1, relay2], {maxSize: 100}),
  );
