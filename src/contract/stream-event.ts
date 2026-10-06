import type {StreamRecord} from "./stream-record.ts";

// An event of the /events stream. EventSource dispatches by event name, a string, so a
// channel's records travel under its number as text.
export type StreamEvent =
  | {readonly name: "ping"; readonly data: Readonly<Record<string, never>>}
  | {readonly name: `${number}`; readonly data: readonly StreamRecord[]};

export function formatEvent({name, data}: StreamEvent): string {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
}
