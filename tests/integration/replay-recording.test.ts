import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import {expect, vi} from "vitest";

import {start} from "../../src/server/replay.ts";
import {collectingSource} from "../../src/server/test-helpers/collecting-source.ts";
import {test} from "../../src/server/test-helpers/fake-clock.ts";

const recorded = [
  {
    k: 294,
    v: 39.72657012939453,
    cv: "39.73",
    t: 1_789_211_884,
    s: 24,
    sid: 1_789_211_888_321,
  },
  {
    k: 295,
    v: -26.246341705322266,
    cv: "-26.25",
    t: 1_789_211_884,
    s: 24,
    sid: 1_789_211_888_321,
  },
  {
    k: 296,
    v: 1_789_211_884,
    cv: "255/11:18:04",
    t: 1_789_211_884,
    s: 24,
    sid: 1_789_211_888_321,
  },
];

function writeRecording(dir: string) {
  const file = path.join(dir, "recording.jsonl.gz");
  fs.writeFileSync(
    file,
    zlib.gzipSync(recorded.map((row) => JSON.stringify(row) + "\n").join("")),
  );
  return file;
}

test("with --no-rebase, replays the gzipped JSONL recording named by --file into the source in order", async ({
  dir,
}) => {
  vi.spyOn(console, "log").mockReturnValue(undefined);
  const {source, records} = collectingSource();

  await start(["--file", writeRecording(dir), "--no-rebase"], source);

  expect(records).to.deep.equal(recorded);
});

test("by default, stamps each replayed record with the wall-clock second it falls due", async ({
  dir,
}) => {
  vi.spyOn(console, "log").mockReturnValue(undefined);
  const {source, records} = collectingSource();
  const file = writeRecording(dir);
  const before = Math.floor(Date.now() / 1000);

  await start(["--file", file], source);

  const after = Math.floor(Date.now() / 1000);
  expect(records.map((record) => ({...record, t: 0}))).to.deep.equal(
    recorded.map((record) => ({...record, t: 0})),
  );
  const times = records.map(({t}) => t);
  expect(Math.min(...times)).to.be.at.least(before);
  expect(Math.max(...times)).to.be.at.most(after);
});

test("rejects a recording holding a row that is not a whole record", async ({dir}) => {
  vi.spyOn(console, "log").mockReturnValue(undefined);
  const recorded = [
    {
      k: 294,
      v: 39.72657012939453,
      cv: "39.73",
      t: 1_789_211_884,
      s: 24,
      sid: 1_789_211_888_321,
    },
    {k: 295, v: -26.246341705322266, cv: "-26.25", t: 1_789_211_884, s: 24},
  ];
  const file = path.join(dir, "recording.jsonl.gz");
  fs.writeFileSync(
    file,
    zlib.gzipSync(recorded.map((row) => JSON.stringify(row) + "\n").join("")),
  );

  await expect(start(["--file", file], collectingSource().source)).rejects.toThrow(
    TypeError,
  );
});
