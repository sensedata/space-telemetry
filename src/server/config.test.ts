import assert from "node:assert";
import {test, vi} from "vitest";

test("rejects a SOURCE that names no producer, naming the producers it accepts", () => {
  vi.stubEnv("SOURCE", "lightstreamr");
  return assert.rejects(import("./config.ts"), {
    name: "RangeError",
    message: "SOURCE must be lightstreamer, replay or none: lightstreamr",
  });
});
