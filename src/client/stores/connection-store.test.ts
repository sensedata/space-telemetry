import {assert, describe, test} from "vitest";

import {ConnectionStore} from "./connection-store.ts";

describe("ConnectionStore", () => {
  test("is not lost before the stream reports an error", () => {
    const store = new ConnectionStore();

    assert.isFalse(store.get());
  });
});
