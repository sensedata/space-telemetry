// Connects to a running server and exercises the client's contract: open GET /events,
// which sends one records event of the last 450 seconds of every channel and then one per
// live record, and count the events holding a record of each probed channel.
//
//   PORT=5055 node src/harness/probe.ts [TELEMETRY_ID ...]
//
// Without arguments it probes USLAB000059, TIME_000001 and STATUS.
import http from "node:http";
import readline from "node:readline";

import * as channels from "../contract/channels.ts";
import type {StreamRecord} from "../contract/stream-record.ts";

const NAMES: ReadonlySet<string> = new Set(channels.names);
const requested = process.argv.slice(2);
const names = requested.length > 0 ? requested : ["USLAB000059", "TIME_000001", "STATUS"];

// eslint-disable-next-line no-restricted-syntax -- the harness is a standalone script, not the server, and reads its own PORT
const port = process.env["PORT"] ?? "";
const url = `http://localhost:${port === "" ? "5055" : port}`;

function log(...args: unknown[]) {
  console.log("[probe " + new Date().toISOString() + "]", ...args);
}

async function probe() {
  const seen = new Map<string, number>();
  const probed = new Set<string>();
  for (const name of names) {
    if (NAMES.has(name)) {
      probed.add(name);
    } else {
      log("no such telemetry id", name);
    }
  }

  // /events never ends on its own, so the probe stops itself after 15 seconds. Until the
  // response arrives, the request is destroyed with an error, which rejects the wait below.
  // unref lets the process exit when the server ends the stream first.
  const request = http.get(url + "/events");
  let stop = () => {
    request.destroy(new Error(`no response from ${url} within 15 seconds`));
  };
  setTimeout(() => {
    stop();
  }, 15_000).unref();
  const response = await new Promise<http.IncomingMessage>((resolve, reject) => {
    request.on("response", resolve).on("error", reject);
  });
  log("connected", response.statusCode);

  // Data before the first event line goes uncounted.
  let event = "";
  const lines = readline.createInterface({input: response});
  // Destroyed without an error, the response emits neither "end" nor "error", so readline stays
  // open until closed; destroyed with one, the loop would throw it.
  stop = () => {
    response.destroy();
    lines.close();
  };
  for await (const line of lines) {
    if (line.startsWith("event: ")) {
      event = line.slice("event: ".length);
    } else if (event === "records" && line.startsWith("data: ")) {
      // The server's own records: the harness trusts their shape.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- a probe of the server's own stream, not a boundary the server guards
      const records = JSON.parse(line.slice("data: ".length)) as StreamRecord[];
      const held = new Set(records.map((record) => record.k));
      for (const channel of held) {
        if (!probed.has(channel)) {
          continue;
        }
        if (!seen.has(channel)) {
          const first = records.find((record) => record.k === channel);
          log("channel", channel, "first record", JSON.stringify(first));
        }
        seen.set(channel, (seen.get(channel) ?? 0) + 1);
      }
    }
  }
  // complete is true only when the server ended the stream, not when stop destroyed it.
  if (response.complete) {
    log("disconnected");
  }
  log("message counts by channel", JSON.stringify(Object.fromEntries(seen)));
}

await probe();
