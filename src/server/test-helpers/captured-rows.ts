import contract from "./contract-rows.json" with {type: "json"};

export type CapturedRow = (typeof contract.groups)[number]["rows"][number];

const byItem = new Map(contract.groups.map(({rows}) => [rows[0]?.item, rows]));

// The rows the capture holds of the telemetry item `item`.
export function capturedRows(item: string): CapturedRow[] {
  const rows = byItem.get(item);
  if (rows === undefined) {
    throw new RangeError("the capture holds no rows of " + item);
  }
  return rows;
}
