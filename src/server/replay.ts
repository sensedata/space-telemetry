// Plays a recording of source records into the source in place of the live feed.
import fs from "node:fs";
import path from "node:path";
import {parseArgs} from "node:util";
import zlib from "node:zlib";

import * as channels from "../contract/channels.ts";
import {type FeedRecord, isFeedRecord} from "./feed-record.ts";

const USAGE =
  "usage: SOURCE=replay node src/server/server.ts [--file PATH] [--rate N] [--no-rebase]";
const RECORDING = path.join(
  import.meta.dirname,
  "..",
  "harness",
  "recordings",
  "1789211888321.jsonl.gz",
);

type Pacing = {readonly rate: number; readonly rebase: boolean};
type Emitter = {emit(event: "data", record: FeedRecord): unknown};

function commandLineValues(args: string[]) {
  try {
    return parseArgs({
      args,
      allowNegative: true,
      options: {
        file: {type: "string", default: RECORDING},
        rate: {type: "string", default: "1"},
        rebase: {type: "boolean", default: true},
      },
    }).values;
  } catch (error) {
    throw new TypeError(USAGE, {cause: error});
  }
}

function parseOptions(args: string[]) {
  const values = commandLineValues(args);
  const rate = Number(values.rate);
  if (!(rate > 0)) {
    throw new RangeError("--rate must be a positive number: " + values.rate);
  }
  return {...values, rate};
}

/**
 * Emits `rows` (source records ordered by t) into `emitter`, spaced as recorded divided by
 * `rate`, except STATUS rows: the source alone derives STATUS. With `rebase`, each record's
 * `t` is the wall-clock second it falls due. Resolves after the last row.
 */
export function play(
  rows: readonly FeedRecord[],
  {rate, rebase}: Pacing,
  emitter: Emitter,
): Promise<void> {
  const telemetry = rows.filter((row) => row.k !== channels.numbers.STATUS);
  const startMs = Date.now();
  // An empty recording has no row to fall due.
  const recordedStart = telemetry[0]?.t ?? 0;
  const dueMs = (row: FeedRecord) => startMs + ((row.t - recordedStart) * 1000) / rate;

  return new Promise((resolve) => {
    let next = 0;
    (function emitDue() {
      const nowMs = Date.now();
      for (
        let row = telemetry[next];
        row && dueMs(row) <= nowMs;
        row = telemetry[++next]
      ) {
        emitter.emit("data", rebase ? {...row, t: Math.floor(dueMs(row) / 1000)} : row);
      }
      const pending = telemetry[next];
      if (pending === undefined) {
        resolve();
      } else {
        setTimeout(emitDue, dueMs(pending) - nowMs);
      }
    })();
  });
}

/**
 * Plays the gzipped JSONL recording the command-line `args` name into `source`. Rejects
 * with TypeError carrying the usage text on bad arguments, RangeError on a bad --rate, and
 * TypeError when a row of the recording is not a whole record.
 */
export async function start(args: string[], source: Emitter): Promise<void> {
  const options = parseOptions(args);
  const rows = zlib
    .gunzipSync(fs.readFileSync(options.file))
    .toString()
    .trimEnd()
    .split("\n")
    .map((line): unknown => JSON.parse(line));
  if (!rows.every(isFeedRecord)) {
    throw new TypeError(options.file + " holds a row that is not a whole record");
  }

  console.log(
    "replaying %d records at rate %d%s",
    rows.length,
    options.rate,
    options.rebase ? ", rebased to now" : ", at recorded times",
  );
  await play(rows, options, source);
  console.log("replay finished");
}
