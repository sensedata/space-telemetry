import {assert, describe, test} from "vitest";

import {derived} from "./derived.ts";
import {signal} from "./signal.ts";

describe("a derived value", () => {
  test("is computed from its sources' values", () => {
    const volts = signal(18);
    const amps = signal(4);

    const watts = derived([volts, amps], (values) =>
      values.reduce((product, value) => product * value, 1),
    );

    assert.equal(watts.get(), 72);
  });

  test("is computed again once a source changes", () => {
    const volts = signal(18);
    const amps = signal(4);
    const watts = derived([volts, amps], (values) =>
      values.reduce((product, value) => product * value, 1),
    );

    amps.set(5);

    assert.equal(watts.get(), 90);
  });

  test("tells its listeners once a source changes", () => {
    const volts = signal(18);
    const watts = derived([volts], (values) =>
      values.reduce((product, value) => product * value, 4),
    );
    const seen: number[] = [];
    watts.subscribe(() => {
      seen.push(watts.get());
    });

    volts.set(20);

    assert.deepEqual(seen, [80]);
  });

  test("holds one value until a source changes", () => {
    const volts = signal(18);
    const readings = derived([volts], (values) => [...values]);

    assert.strictEqual(readings.get(), readings.get());
  });
});
