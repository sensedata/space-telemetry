import {assert, describe, test} from "vitest";

import {parseCellProps} from "./cell-props.ts";

function cellOf(html: string): Element {
  const template = document.createElement("template");
  // eslint-disable-next-line no-unsanitized/property -- html is a literal of the test's own, and a template is what parses a bare <td>
  template.innerHTML = html;
  const cell = template.content.firstElementChild;
  if (cell === null) {
    throw new TypeError(`no element in ${html}`);
  }
  return cell;
}

describe("a telemetry cell's props", () => {
  test("read a decimal readout's channel, scale and conversion", () => {
    const cell = cellOf(
      '<td class="readout milligrams-per-second decimal" data-scale="1" data-telemetry-id="S1000001" title="S1000001" data-conversion="277.777778"></td>',
    );

    assert.deepEqual(parseCellProps(cell), {
      source: {kind: "channel", channel: "S1000001"},
      scale: 1,
      conversion: 277.777778,
    });
  });

  test("read a summed cell's channels", () => {
    const cell = cellOf(
      '<td class="readout amps decimal" data-combine="sum" data-telemetry-ids="S4000002,P6000005" data-scale="2"></td>',
    );

    assert.deepEqual(parseCellProps(cell), {
      source: {kind: "sum", channels: ["S4000002", "P6000005"]},
      scale: 2,
    });
  });

  test("read a deviation cell's channels", () => {
    const cell = cellOf(
      '<td class="readout volts decimal" data-combine="deviation" data-telemetry-ids="S4000001,P4000001" data-scale="2"></td>',
    );

    assert.deepEqual(parseCellProps(cell), {
      source: {kind: "deviation", channels: ["S4000001", "P4000001"]},
      scale: 2,
    });
  });

  test("read an angle deviation cell's channels and how each is mounted", () => {
    const cell = cellOf(
      '<td class="readout degrees decimal" data-combine="angle-deviation" data-telemetry-ids="S4000007,-S4000008,180-P4000007,180+P4000008" data-scale="1"></td>',
    );

    assert.deepEqual(parseCellProps(cell), {
      source: {
        kind: "angle-deviation",
        angles: [
          {channel: "S4000007", negated: false, turned: false},
          {channel: "S4000008", negated: true, turned: false},
          {channel: "P4000007", negated: true, turned: true},
          {channel: "P4000008", negated: false, turned: true},
        ],
      },
      scale: 1,
    });
  });

  test("read a power cell's pairs of volts and amps channels", () => {
    const cell = cellOf(
      '<td class="readout watts decimal" data-combine="power" data-telemetry-ids="AIRLOCK000001*AIRLOCK000002,AIRLOCK000003*AIRLOCK000004" data-scale="1"></td>',
    );

    assert.deepEqual(parseCellProps(cell), {
      source: {
        kind: "power",
        pairs: [
          {volts: "AIRLOCK000001", amps: "AIRLOCK000002"},
          {volts: "AIRLOCK000003", amps: "AIRLOCK000004"},
        ],
      },
      scale: 1,
    });
  });

  test("read a quaternion readout's axis and channels", () => {
    const cell = cellOf(
      '<td class="readout degrees decimal attitude actual" data-scale="2" data-quaternion-id="attitude-actual" data-euler-axis="x" data-telemetry-id-x="USLAB000019" data-telemetry-id-y="USLAB000020" data-telemetry-id-z="USLAB000021" data-telemetry-id-w="USLAB000018"></td>',
    );

    assert.deepEqual(parseCellProps(cell), {
      source: {
        kind: "quaternion",
        quaternionId: "attitude-actual",
        eulerAxis: "x",
        axes: {x: "USLAB000019", y: "USLAB000020", z: "USLAB000021", w: "USLAB000018"},
      },
      scale: 2,
    });
  });

  test.each([
    ["true", true],
    ["false", false],
  ])('read data-negative-pad="%s" as the flag %s', (text, negativePad) => {
    const cell = cellOf(
      `<td class="readout decimal" data-telemetry-id="S1000001" data-negative-pad="${text}"></td>`,
    );

    assert.deepEqual(parseCellProps(cell), {
      source: {kind: "channel", channel: "S1000001"},
      negativePad,
    });
  });

  test("are absent from a cell without data attributes, which the page fills itself", () => {
    const cell = cellOf('<dd id="telemetry-network" class="readout text"></dd>');

    assert.isUndefined(parseCellProps(cell));
  });

  test("refuse a channel the data dictionary does not hold", () => {
    const cell = cellOf(
      '<td class="readout decimal" data-telemetry-id="USLAB999999"></td>',
    );

    assert.throws(() => parseCellProps(cell), RangeError);
  });

  test("refuse a channel the server does not carry", () => {
    const cell = cellOf(
      '<td class="readout decimal" data-telemetry-id="USLAB000085"></td>',
    );

    assert.throws(
      () => parseCellProps(cell),
      RangeError,
      /no carried telemetry channel "USLAB000085"/,
    );
  });

  test.each([
    [
      "an attribute without the data- prefix",
      '<td class="readout decimal" data-telemetry-id="S1000001" conversion="277.777778"></td>',
    ],
    [
      "a data attribute no view reads",
      '<td class="readout decimal" data-telemetry-id="S1000001" data-convertion="277.777778"></td>',
    ],
    [
      "a number that is not one",
      '<td class="readout decimal" data-telemetry-id="S1000001" data-scale="one"></td>',
    ],
    [
      "an empty number",
      '<td class="readout decimal" data-telemetry-id="S1000001" data-scale=""></td>',
    ],
    [
      "a blank number",
      '<td class="readout decimal" data-telemetry-id="S1000001" data-scale=" "></td>',
    ],
    [
      "a flag other than true or false",
      '<td class="readout decimal" data-telemetry-id="S1000001" data-negative-pad="yes"></td>',
    ],
    [
      "channels without a combination",
      '<td class="readout decimal" data-telemetry-ids="S4000002,P6000005"></td>',
    ],
    [
      "a power cell's volts without their amps",
      '<td class="readout decimal" data-combine="power" data-telemetry-ids="AIRLOCK000001"></td>',
    ],
    [
      "a combination the page does not know",
      '<td class="readout decimal" data-combine="median" data-telemetry-ids="S4000002,P6000005"></td>',
    ],
    [
      "a quaternion without its w channel",
      '<td class="readout decimal" data-quaternion-id="attitude-actual" data-euler-axis="x" data-telemetry-id-x="USLAB000019" data-telemetry-id-y="USLAB000020" data-telemetry-id-z="USLAB000021"></td>',
    ],
    [
      "an Euler axis other than x, y or z",
      '<td class="readout decimal" data-quaternion-id="attitude-actual" data-euler-axis="w" data-telemetry-id-x="USLAB000019" data-telemetry-id-y="USLAB000020" data-telemetry-id-z="USLAB000021" data-telemetry-id-w="USLAB000018"></td>',
    ],
    [
      "view attributes without a channel",
      '<td class="readout decimal" data-scale="1"></td>',
    ],
  ])("refuse %s", (_, html) => {
    assert.throws(() => parseCellProps(cellOf(html)), TypeError);
  });
});
