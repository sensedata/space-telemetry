import fs from "node:fs";
import type {IncomingMessage, ServerResponse} from "node:http";
import path from "node:path";

// The file types the client build emits; a browser runs a module script only when it is
// served as JavaScript.
const CONTENT_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
]);

// What reading a path that names no file fails with.
const NOT_FOUND = new Set(["ENOENT", "ENOTDIR", "EISDIR"]);

function notFound(res: ServerResponse) {
  res.writeHead(404, {"Content-Type": "text/plain; charset=utf-8"}).end("Not Found");
}

async function read(file: string) {
  try {
    const [body, {mtime}] = await Promise.all([
      fs.promises.readFile(file),
      fs.promises.stat(file),
    ]);
    return {body, mtime};
  } catch (error) {
    if (error instanceof Error && "code" in error && NOT_FOUND.has(String(error.code))) {
      return;
    }
    throw error;
  }
}

/**
 * Answers `req` with the file under `root` its URL path names, `/` naming index.html,
 * cacheable for five minutes. Answers 304 to an If-Modified-Since no earlier than the file's
 * modification, 404 when the path names no file under `root`, and 500 when the file
 * cannot be read.
 */
export async function serveStaticFile(
  root: string,
  req: Pick<IncomingMessage, "url" | "headers">,
  res: ServerResponse,
): Promise<void> {
  const {pathname} = new URL(req.url ?? "/", "http://localhost");
  const file = path.join(root, pathname === "/" ? "index.html" : pathname);
  const relative = path.relative(root, file);
  if (
    relative === ".." ||
    relative.startsWith(".." + path.sep) ||
    path.isAbsolute(relative)
  ) {
    notFound(res);
    return;
  }
  let found;
  try {
    found = await read(file);
  } catch (error) {
    console.error("serving %s failed:", pathname, error);
    res.writeHead(500).end();
    return;
  }
  if (found === undefined) {
    notFound(res);
    return;
  }
  const lastModified = found.mtime.toUTCString();
  const headers = {
    "Cache-Control": "public, max-age=300",
    "Last-Modified": lastModified,
  };
  // HTTP dates hold whole seconds, as lastModified does.
  if (Date.parse(lastModified) <= Date.parse(req.headers["if-modified-since"] ?? "")) {
    res.writeHead(304, headers).end();
    return;
  }
  res
    .writeHead(200, {
      ...headers,
      "Content-Type": CONTENT_TYPES.get(path.extname(file)) ?? "application/octet-stream",
    })
    .end(found.body);
}
