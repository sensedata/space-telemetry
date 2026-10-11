/**
 * Whether `acceptEncoding` names gzip at a weight above 0. A wildcard does not count:
 * identity suits every client.
 */
export function acceptsGzip(acceptEncoding = ""): boolean {
  return acceptEncoding.split(",").some((entry) => {
    // RFC 9110 gives a coding no parameter but its weight, "q=".
    const [coding, weight = "q=1"] = entry
      .split(";")
      .map((part) => part.trim().toLowerCase());
    return coding === "gzip" && Number(weight.replace("q=", "")) > 0;
  });
}
