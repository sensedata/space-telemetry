import assert from "node:assert";
import {describe, test} from "vitest";

import {start} from "./replay.ts";
import {createSource} from "./source.ts";

describe("replay arguments", () => {
  test("rejects an unknown option with usage text naming the server entry point", () =>
    assert.rejects(start(["--session", "1789211888321"], createSource()), {
      name: "TypeError",
      message: /^usage: SOURCE=replay node src\/server\/server\.ts /,
    }));

  test.each([
    ["zero", "0"],
    ["not a number", "fast"],
  ])("rejects a --rate of %s", (_kind, rate) =>
    assert.rejects(start(["--rate", rate], createSource()), RangeError),
  );
});
