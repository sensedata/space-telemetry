import type {Server} from "node:net";

/**
 * The TCP port `server` listens on. Throws a TypeError when it listens on none.
 */
export function listeningPort(server: Pick<Server, "address">): number {
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new TypeError("the server listens on no TCP port");
  }
  return address.port;
}
