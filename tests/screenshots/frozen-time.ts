// The newest record time in src/server/seed/buffer.json.gz, in milliseconds. The server and
// the page both read the clock as this instant, so the backfill and the charts' windows
// render the same on every run.
export const FROZEN_MS = 1_789_395_307_000;
