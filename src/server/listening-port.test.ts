import net from "node:net";
import {expect, test} from "vitest";
import {listeningPort} from "./listening-port.ts";

test("reads the port of a server listening on TCP", () => {
  const server = {address: () => ({address: "0.0.0.0", family: "IPv4", port: 3000})};

  expect(listeningPort(server)).to.equal(3000);
});

test("rejects a server not listening", () => {
  expect(() => listeningPort(net.createServer())).to.throw(
    TypeError,
    "the server listens on no TCP port",
  );
});

test("rejects a server listening on a pipe", () => {
  const server = {address: () => "/tmp/telemetry.sock"};

  expect(() => listeningPort(server)).to.throw(
    TypeError,
    "the server listens on no TCP port",
  );
});
