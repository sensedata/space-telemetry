import path from "node:path";

// An empty variable reads as unset.
function setting(name: string): string | undefined {
  const value = process.env[name];
  return value === "" ? undefined : value;
}

const sourceNames = ["lightstreamer", "replay", "none"] as const;
export type SourceName = (typeof sourceNames)[number];

function sourceName(name: string): SourceName {
  const found = sourceNames.find((known) => known === name);
  if (found === undefined) {
    throw new RangeError("SOURCE must be lightstreamer, replay or none: " + name);
  }
  return found;
}

const dataDir = process.env["DATA_DIR"];

// The server's settings, read from its environment once, at startup.
export const config = {
  port: Number(setting("PORT") ?? 3000),
  // DATA_DIR set empty turns persistence off; unset, the buffer is kept in data/ at the
  // root of the tree this file sits in.
  dataDir:
    dataDir === ""
      ? undefined
      : (dataDir ?? path.join(import.meta.dirname, "..", "..", "data")),
  snapshotSeconds: Number(setting("SNAPSHOT_SECONDS") ?? 30),
  // persist.keep defaults only an unset seed file, so an empty one stays empty.
  seedFile: process.env["SEED_FILE"],
  source: sourceName(setting("SOURCE") ?? "lightstreamer"),
  // Unset, the page is served from dist/ at the root of the tree this file sits in, where
  // vite.config.ts builds it.
  staticDir: setting("STATIC_DIR") ?? path.join(import.meta.dirname, "..", "..", "dist"),
} as const;
