import type {StreamRecord} from "./stream-record.ts";

// An event of the /events stream. A records event holds records of any channels, each
// naming its own: the backfill is one, and each live record is one.
export type StreamEvent =
  | {readonly name: "ping"; readonly data: Readonly<Record<string, never>>}
  | {readonly name: "records"; readonly data: readonly StreamRecord[]};

export function formatEvent({name, data}: StreamEvent): string {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
}
