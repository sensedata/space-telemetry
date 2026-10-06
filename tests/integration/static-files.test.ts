import fs from "node:fs";
import http, {type IncomingHttpHeaders} from "node:http";
import path from "node:path";
import {describe, expect, vi} from "vitest";

import {listeningPort} from "../../src/server/listening-port.ts";
import {test} from "./test-helpers/static-server.ts";

const MODIFIED = new Date("2026-09-12T11:23:09Z");

type Reply = {status: number | undefined; headers: IncomingHttpHeaders; body: string};

// Requests `rawPath` of `server` as sent, since fetch and URL resolve dot segments before
// sending.
async function get(
  server: http.Server,
  rawPath: string,
  headers: http.OutgoingHttpHeaders = {},
): Promise<Reply> {
  const response = await new Promise<http.IncomingMessage>((resolve) =>
    // By address: resolving localhost can stall for a test's whole timeout.
    http.get(
      {host: "127.0.0.1", port: listeningPort(server), path: rawPath, headers},
      resolve,
    ),
  );
  response.setEncoding("utf8");
  let body = "";
  for await (const chunk of response) {
    body += String(chunk);
  }
  return {status: response.statusCode, headers: response.headers, body};
}

function writeFile(root: string, relative: string, text: string) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, text);
  fs.utimesSync(file, MODIFIED, MODIFIED);
}

describe("serving a file under the root", () => {
  test("answers with the file its path names", async ({root, server}) => {
    writeFile(root, "assets/index-B0lOW2hH.js", 'console.log("page");');

    const reply = await get(server, "/assets/index-B0lOW2hH.js");

    expect([reply.status, reply.body]).to.deep.equal([200, 'console.log("page");']);
  });

  test("answers / with index.html", async ({root, server}) => {
    writeFile(root, "index.html", "<!DOCTYPE html>");

    const reply = await get(server, "/");

    expect([reply.status, reply.body]).to.deep.equal([200, "<!DOCTYPE html>"]);
  });

  test.for([
    ["index.html", "text/html; charset=utf-8"],
    ["assets/index-B0lOW2hH.js", "text/javascript; charset=utf-8"],
    ["assets/index-C4ye8T2Z.css", "text/css; charset=utf-8"],
    ["fonts/unicode-iec-symbol.woff", "application/octet-stream"],
  ] as const)("labels %s as %s", async ([file, contentType], {root, server}) => {
    writeFile(root, file, "x");

    const reply = await get(server, "/" + file);

    expect(reply.headers["content-type"]).to.equal(contentType);
  });

  test("marks the file cacheable for five minutes and modified when the file was", async ({
    root,
    server,
  }) => {
    writeFile(root, "index.html", "<!DOCTYPE html>");

    const reply = await get(server, "/index.html");

    expect([
      reply.headers["cache-control"],
      reply.headers["last-modified"],
    ]).to.deep.equal(["public, max-age=300", "Sat, 12 Sep 2026 11:23:09 GMT"]);
  });

  test("answers with a file whose name starts with two dots", async ({root, server}) => {
    writeFile(root, "..foo.js", 'console.log("dots");');

    const reply = await get(server, "/..foo.js");

    expect([reply.status, reply.body]).to.deep.equal([200, 'console.log("dots");']);
  });

  test("serves a file written after the server started", async ({server, root}) => {
    await get(server, "/index.html");
    writeFile(root, "index.html", "<!DOCTYPE html>");

    const reply = await get(server, "/index.html");

    expect([reply.status, reply.body]).to.deep.equal([200, "<!DOCTYPE html>"]);
  });
});

describe("a conditional request", () => {
  test.for([
    ["a second before the file was modified", "Sat, 12 Sep 2026 11:23:08 GMT", 200],
    ["when the file was modified", "Sat, 12 Sep 2026 11:23:09 GMT", 304],
    ["a second after the file was modified", "Sat, 12 Sep 2026 11:23:10 GMT", 304],
    ["on a date that is not a date", "yesterday", 200],
  ] as const)(
    "modified since %s answers %i",
    async ([, since, status], {root, server}) => {
      writeFile(root, "index.html", "<!DOCTYPE html>");

      const reply = await get(server, "/index.html", {"if-modified-since": since});

      expect(reply.status).to.equal(status);
    },
  );

  test("answers 304 with no body", async ({root, server}) => {
    writeFile(root, "index.html", "<!DOCTYPE html>");

    const reply = await get(server, "/index.html", {
      "if-modified-since": "Sat, 12 Sep 2026 11:23:09 GMT",
    });

    expect(reply.body).to.equal("");
  });
});

describe("a path that names no file under the root", () => {
  test.for([
    ["a missing file", "/missing.js"],
    ["a directory", "/assets"],
    ["a path through a file", "/assets/index-B0lOW2hH.js/index.html"],
    ["a file beyond the root", "/../secret.txt"],
    ["a file beyond the root by encoded dots", "/%2e%2e/secret.txt"],
    ["a file beyond the root by an encoded slash", "/..%2fsecret.txt"],
    ["a file beyond the root by a backslash", String.raw`/..\secret.txt`],
  ] as const)("answers 404 for %s", async ([, rawPath], {dir, root, server}) => {
    fs.writeFileSync(path.join(dir, "secret.txt"), "secret");
    writeFile(root, "assets/index-B0lOW2hH.js", 'console.log("page");');

    const reply = await get(server, rawPath);

    expect([reply.status, reply.body]).to.deep.equal([404, "Not Found"]);
  });

  test("labels the answer as plain text", async ({server}) => {
    const reply = await get(server, "/missing.js");

    expect(reply.headers["content-type"]).to.equal("text/plain; charset=utf-8");
  });
});

// A file mode does not stop Windows reading a file, nor stop root.
test.skipIf(process.platform === "win32" || process.getuid?.() === 0)(
  "answers 500 for a file it cannot read",
  async ({root, server}) => {
    writeFile(root, "index.html", "<!DOCTYPE html>");
    fs.chmodSync(path.join(root, "index.html"), 0o000);
    const error = vi.spyOn(console, "error").mockReturnValue(undefined);

    const reply = await get(server, "/index.html");
    error.mockRestore();

    expect(reply.status).to.equal(500);
  },
);
