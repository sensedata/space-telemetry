import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

import * as channels from "../contract/channels.ts";
import type {RecordBuffer} from "./buffer.ts";

const STATUS = channels.numbers.STATUS;
const SEED = path.join(import.meta.dirname, "seed", "buffer.json.gz");

// setTimeout runs a longer delay after 1 ms instead.
const LONGEST_DELAY_MS = 2 ** 31 - 1;

// JSON writes NaN as null. Only v, t and s can be NaN; cv is text.
function reviveNaN(key: string, value: unknown) {
  return value === null && ["v", "t", "s"].includes(key) ? NaN : value;
}

// Answers undefined when there is no file at `file`.
function readText(file: string) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}

/**
 * Replaces the buffer's records with those saved in `file`, and returns whether the file
 * exists. When the file is missing, logs one line, and when it is not JSON, reports one
 * error; either way the buffer is left as it is. Throws any other read error.
 */
export function load(buffer: Pick<RecordBuffer, "restore">, file: string): boolean {
  const text = readText(file);
  if (text === undefined) {
    console.log("no buffer snapshot at " + file);
    return false;
  }
  let snapshot: unknown;
  try {
    snapshot = JSON.parse(text, reviveNaN);
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }
    console.error("buffer snapshot rejected:", file + ":", error.message);
    return true;
  }
  buffer.restore(snapshot);
  return true;
}

// STATUS describes the feed of the process that saved it; the server reports it afresh at
// boot.
function serialise(buffer: Pick<RecordBuffer, "snapshot">) {
  const {[STATUS]: status, ...snapshot} = buffer.snapshot();
  return JSON.stringify(snapshot);
}

/** Writes the buffer's records but STATUS to `file` as JSON; a kill mid-write leaves the file as it was. */
export async function save(
  buffer: Pick<RecordBuffer, "snapshot">,
  file: string,
): Promise<void> {
  const temporary = file + ".tmp";
  await fs.promises.writeFile(temporary, serialise(buffer));
  await fs.promises.rename(temporary, file);
}

// Not save's temporary file: a periodic save may still be writing that when a signal arrives.
function saveSync(buffer: Pick<RecordBuffer, "snapshot">, file: string) {
  const temporary = file + ".exit.tmp";
  fs.writeFileSync(temporary, serialise(buffer));
  fs.renameSync(temporary, file);
}

/**
 * Creates `dataDir` if it is missing, and loads the buffer from `dataDir`/buffer.json, or
 * when that is missing, from `seedFile`, a gzipped snapshot, logging one line. Then saves it
 * to buffer.json `seconds` after each save ends, logging a failed save, and on SIGINT or
 * SIGTERM, after which the process exits with 128 plus the signal's number. Throws a
 * RangeError unless `seconds` is above 0 and at most 2147483.647.
 */
export function keep(
  buffer: Pick<RecordBuffer, "restore" | "snapshot">,
  dataDir: string,
  seconds: number,
  seedFile = SEED,
): void {
  const delay = seconds * 1000;
  if (!(delay > 0 && delay <= LONGEST_DELAY_MS)) {
    throw new RangeError(
      `SNAPSHOT_SECONDS must be above 0 and at most 2147483.647: ${seconds}`,
    );
  }
  fs.mkdirSync(dataDir, {recursive: true});
  const file = path.join(dataDir, "buffer.json");
  if (!load(buffer, file)) {
    console.log("restoring the buffer seed " + seedFile);
    const seed: unknown = JSON.parse(
      zlib.gunzipSync(fs.readFileSync(seedFile)).toString(),
      reviveNaN,
    );
    buffer.restore(seed);
  }
  // Scheduled only once the last save ends: saves share one temporary file.
  const saveLater = () =>
    setTimeout(() => {
      void save(buffer, file)
        .catch((error: unknown) => {
          console.error("buffer snapshot failed:", error);
        })
        .then(saveLater);
    }, delay);
  saveLater();
  for (const signal of ["SIGINT", "SIGTERM"] as const)
    process.once(signal, () => {
      saveSync(buffer, file);
      process.exit(128 + os.constants.signals[signal]);
    });
}
