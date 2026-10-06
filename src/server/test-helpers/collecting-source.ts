import type {FeedRecord} from "../feed-record.ts";

// source is a replay target that keeps each record it is given, in order, in records.
export function collectingSource(): {
  source: {emit(event: "data", record: FeedRecord): void};
  records: FeedRecord[];
} {
  const records: FeedRecord[] = [];
  const source = {
    emit(_event: "data", record: FeedRecord) {
      records.push(record);
    },
  };
  return {source, records};
}
