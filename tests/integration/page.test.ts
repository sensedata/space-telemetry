// @vitest-environment jsdom
// The page renders into a document. The integration project runs in node for app.test.ts,
// whose Node EventSource dispatches Node's Event, which jsdom's global Event would replace.
import {act} from "preact/test-utils";
import {assert, describe, expect, vi} from "vitest";

import {streamRecord} from "../../src/client/test-helpers/records.ts";
import {test} from "./test-helpers/page-stream.ts";

function newestSparklineX(): number {
  return Number(
    document
      .querySelector('.sparkline-chart[data-telemetry-id="USLAB000059"] circle')
      ?.getAttribute("cx"),
  );
}

describe("page", () => {
  test("boots and renders the network status and station mode the stream sends", async ({
    stream,
  }) => {
    await import("../../src/client/page.ts");

    await act(() => {
      stream().open();
      stream().send({
        name: "297",
        data: [streamRecord({k: 297, v: 1, t: 1_790_560_000, s: 24})],
      });
      stream().send({
        name: "264",
        data: [streamRecord({k: 264, v: 4, t: 1_790_560_000, s: 24})],
      });
    });

    const readouts = [
      document.querySelector("#telemetry-network")?.textContent,
      document.querySelector('[data-telemetry-id="USLAB000086"]')?.textContent,
    ];
    assert.deepEqual(readouts, ["Connected", "Reboost"]);
  });

  test("reads No signal in the header while the stream is up and the feed is down", async ({
    stream,
  }) => {
    await import("../../src/client/page.ts");

    await act(() => {
      stream().open();
      stream().send({
        name: "297",
        data: [streamRecord({k: 297, v: 0, t: 1_790_560_000, s: 2})],
      });
    });

    assert.equal(document.querySelector("#telemetry-network")?.textContent, "No signal");
  });

  test("paints a status light off while its channel holds no record", async ({
    stream,
  }) => {
    await import("../../src/client/page.ts");

    stream().open();
    stream().send({name: "179", data: []});

    assert.deepEqual(
      [
        ...(document.querySelector('.status[data-telemetry-id="USLAB000001"]')
          ?.classList ?? []),
      ],
      ["col-sm-6", "status", "cmg", "off"],
    );
  });

  test("reads the desaturation thrusters enabled at the feed's 0", async ({stream}) => {
    await import("../../src/client/page.ts");

    stream().open();
    stream().send({
      name: "189",
      data: [streamRecord({k: 189, v: 0, t: 1_790_560_000, s: 24})],
    });

    assert.deepEqual(
      [...(document.querySelector(".desaturation")?.classList ?? [])],
      ["status", "USLAB000011", "desaturation", "on"],
    );
  });

  test("reads the desaturation thrusters inhibited at the feed's 1", async ({stream}) => {
    await import("../../src/client/page.ts");

    stream().open();
    stream().send({
      name: "189",
      data: [streamRecord({k: 189, v: 1, t: 1_790_560_000, s: 24})],
    });

    assert.deepEqual(
      [...(document.querySelector(".desaturation")?.classList ?? [])],
      ["status", "USLAB000011", "desaturation", "off"],
    );
  });

  test.for([
    ["a power supply's voltage", "AIRLOCK000001", "Supply Voltage"],
    ["a power supply's current", "AIRLOCK000002", "Supply Current"],
    ["the utility supply's voltage", "AIRLOCK000005", "Supply Voltage"],
    ["an umbilical's voltage", "AIRLOCK000007", "Umbilical Voltage"],
    ["an umbilical's current", "AIRLOCK000008", "Umbilical Current"],
    ["a solar array's voltage", "S4000004", "Voltage"],
  ] as const)("labels %s", ([, telemetryId, label]) => {
    const row = document
      .querySelector(`.readout[data-telemetry-id="${CSS.escape(telemetryId)}"]`)
      ?.closest("tr");

    assert.equal(row?.querySelector("th")?.textContent, label);
  });

  test("labels the gyroscopes' momentum as momentum", () => {
    const term = document
      .querySelector('.readout[data-telemetry-id="USLAB000009"]')
      ?.closest("dl")
      ?.querySelector("dt");

    assert.equal(term?.textContent, "Active Gyroscope Momentum");
  });

  test("refuses a status light that names no value to turn it on", async () => {
    document
      .querySelector('.status[data-telemetry-id="USLAB000001"]')
      ?.removeAttribute("data-status-on-value");

    await expect(import("../../src/client/page.ts")).rejects.toThrow(TypeError);
  });

  test("moves a sparkline's newest point left while no record arrives", async ({
    stream,
  }) => {
    vi.setSystemTime(1_790_560_000_000);
    await import("../../src/client/page.ts");
    await act(() => {
      stream().open();
      stream().send({
        name: "237",
        data: [streamRecord({k: 237, v: 21.5, t: 1_790_560_000, s: 24})],
      });
    });
    const drawnX = newestSparklineX();

    await act(() => {
      vi.advanceTimersByTime(2000);
    });

    assert.isBelow(newestSparklineX(), drawnX);
  });

  test("draws a bar chart's bars between the cell's data-min and data-max", async ({
    stream,
  }) => {
    vi.setSystemTime(1_790_560_000_000);
    // jsdom lays nothing out, so every cell measures as a browser would size a cell whose
    // content is 30 by 20 inside jsdom's 1 pixel of table cell padding.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(
      new DOMRect(0, 0, 32, 22),
    );
    await import("../../src/client/page.ts");

    await act(() => {
      stream().open();
      stream().send({
        name: "234",
        data: [streamRecord({k: 234, v: 50, t: 1_790_560_000, s: 24})],
      });
    });

    // Half of 0 to 100 is half of the cell's height, across a bar each 3 of its 30 pixels.
    const heights = [
      ...document.querySelectorAll('.bar-chart[data-telemetry-id="USLAB000056"] rect'),
    ].map((bar) => bar.getAttribute("height"));
    assert.deepEqual(heights, [
      "10",
      "10",
      "10",
      "10",
      "10",
      "10",
      "10",
      "10",
      "10",
      "10",
    ]);
  });

  test("redraws a chart to its cell's size when the window narrows", async ({stream}) => {
    vi.setSystemTime(1_790_560_000_000);
    // An empty cell measures the given width; a chart drawn holds its cell open at the 32
    // it was drawn to, as in a table whose columns its content sizes.
    const heldOpen = (width: number) =>
      function (this: Element) {
        return new DOMRect(0, 0, this.querySelector("svg") === null ? width : 32, 22);
      };
    const measure = vi
      .spyOn(Element.prototype, "getBoundingClientRect")
      .mockImplementation(heldOpen(32));
    await import("../../src/client/page.ts");
    await act(() => {
      stream().open();
      stream().send({
        name: "234",
        data: [streamRecord({k: 234, v: 50, t: 1_790_560_000, s: 24})],
      });
    });

    // A content box of 15 holds a bar each 3 pixels, where 30 held 10.
    measure.mockImplementation(heldOpen(17));
    await act(() => {
      dispatchEvent(new Event("resize"));
    });

    const chart = document.querySelector('.bar-chart[data-telemetry-id="USLAB000056"]');
    assert.deepEqual(
      [
        chart?.querySelector("svg")?.getAttribute("width"),
        chart?.querySelectorAll("rect").length,
      ],
      ["15", 5],
    );
  });

  test("shows a control moment gyroscope's speed as a whole number", async ({stream}) => {
    await import("../../src/client/page.ts");

    await act(() => {
      stream().open();
      stream().send({
        name: "289",
        data: [streamRecord({k: 289, v: 6600.4, t: 1_790_560_000, s: 24})],
      });
    });

    assert.equal(
      document.querySelector('.readout[data-telemetry-id="Z1000009"]')?.textContent,
      "6600",
    );
  });

  test("shows the time of the feed's own clock record", async ({stream}) => {
    await import("../../src/client/page.ts");

    await act(() => {
      stream().open();
      stream().send({
        name: "296",
        data: [streamRecord({k: 296, v: 1, t: 1_790_560_000, s: 24})],
      });
    });

    assert.equal(
      document.querySelector('.readout[data-telemetry-id="TIME_000001"]')?.textContent,
      "01:46:40 2026.09.28",
    );
  });

  test("asks for its stream at the page's own origin", async ({stream}) => {
    await import("../../src/client/page.ts");

    assert.equal(stream().url, "/events");
  });

  test("opens a new stream once the one it has is silent for 30 s", async ({stream}) => {
    await import("../../src/client/page.ts");
    stream().open();

    await act(() => {
      vi.advanceTimersByTime(30_000);
      // The reconnect waits out a backoff, whose length is the app's to choose.
      vi.runOnlyPendingTimers();
    });

    assert.equal(stream(1).url, "/events");
  });

  test("shows the attitude's yaw from the station's quaternion", async ({stream}) => {
    await import("../../src/client/page.ts");

    await act(() => {
      stream().open();
      stream().send({
        name: "196",
        data: [streamRecord({k: 196, v: Math.SQRT1_2, t: 1_790_560_000, s: 24})],
      });
      stream().send({
        name: "197",
        data: [streamRecord({k: 197, v: 0, t: 1_790_560_000, s: 24})],
      });
      stream().send({
        name: "198",
        data: [streamRecord({k: 198, v: 0, t: 1_790_560_000, s: 24})],
      });
      stream().send({
        name: "199",
        data: [streamRecord({k: 199, v: Math.SQRT1_2, t: 1_790_560_000, s: 24})],
      });
    });

    const yaw = document.querySelector(
      '[data-quaternion-id="attitude-actual"][data-euler-axis="z"]',
    );
    assert.equal(yaw?.textContent, "90.00");
  });

  test("shows the average of a cell's channels", async ({stream}) => {
    await import("../../src/client/page.ts");

    await act(() => {
      stream().open();
      stream().send({
        name: "231",
        data: [streamRecord({k: 231, v: 700, t: 1_790_560_000, s: 24})],
      });
      stream().send({
        name: "67",
        data: [streamRecord({k: 67, v: 750, t: 1_790_560_000, s: 24})],
      });
    });

    const average = document.querySelector(
      '.readout[data-telemetry-ids="USLAB000053,NODE3000001"]',
    );
    assert.equal(average?.textContent, "725.0");
  });

  test("shows the sum of a cell's channels", async ({stream}) => {
    await import("../../src/client/page.ts");

    await act(() => {
      stream().open();
      stream().send({
        name: "99",
        data: [streamRecord({k: 99, v: 10, t: 1_790_560_000, s: 24})],
      });
      stream().send({
        name: "110",
        data: [streamRecord({k: 110, v: 20.5, t: 1_790_560_000, s: 24})],
      });
    });

    const sum = document.querySelector(
      '.readout[data-telemetry-ids="P4000002,P6000005"]',
    );
    assert.equal(sum?.textContent, "30.5");
  });

  test("shows the oxygen generation rate in milligrams per second", async ({stream}) => {
    await import("../../src/client/page.ts");

    await act(() => {
      stream().open();
      stream().send({
        name: "77",
        data: [streamRecord({k: 77, v: 1.2, t: 1_790_560_000, s: 24})],
      });
    });

    const rate = document.querySelector('.readout[data-telemetry-id="NODE3000011"]');
    assert.equal(rate?.textContent, "13.89");
  });

  test.for([
    ["loop A", "S1000001", 152],
    ["loop B", "P1000001", 87],
  ] as const)(
    "shows the %s radiator flow rate in kilograms per second",
    async ([, telemetryId, k], {stream}) => {
      await import("../../src/client/page.ts");

      await act(() => {
        stream().open();
        stream().send({
          name: `${k}`,
          data: [streamRecord({k, v: 3459, t: 1_790_560_000, s: 24})],
        });
      });

      const rate = document.querySelector(
        `.readout[data-telemetry-id="${CSS.escape(telemetryId)}"]`,
      );
      assert.equal(rate?.textContent, "0.961");
    },
  );

  test("shows the time of the newest station record as the last telemetry sent", async ({
    stream,
  }) => {
    await import("../../src/client/page.ts");

    await act(() => {
      stream().open();
      stream().send({
        name: "237",
        data: [streamRecord({k: 237, v: 21.5, t: 1_790_560_000, s: 24})],
      });
    });

    assert.equal(
      document.querySelector("#telemetry-transmitted")?.textContent,
      "01:46:40 2026.09.28",
    );
  });

  test("leaves the feed's STATUS out of the last telemetry sent", async ({stream}) => {
    await import("../../src/client/page.ts");

    await act(() => {
      stream().open();
      stream().send({
        name: "237",
        data: [streamRecord({k: 237, v: 21.5, t: 1_790_560_000, s: 24})],
      });
      stream().send({
        name: "297",
        data: [streamRecord({k: 297, v: 1, t: 1_790_560_300, s: 24})],
      });
    });

    assert.equal(
      document.querySelector("#telemetry-transmitted")?.textContent,
      "01:46:40 2026.09.28",
    );
  });

  test("leaves the feed's TIME_000001 out of the last telemetry sent", async ({
    stream,
  }) => {
    await import("../../src/client/page.ts");

    await act(() => {
      stream().open();
      stream().send({
        name: "237",
        data: [streamRecord({k: 237, v: 21.5, t: 1_790_560_000, s: 24})],
      });
      stream().send({
        name: "296",
        data: [streamRecord({k: 296, v: 1, t: 1_790_560_300, s: 24})],
      });
    });

    assert.equal(
      document.querySelector("#telemetry-transmitted")?.textContent,
      "01:46:40 2026.09.28",
    );
  });
});
