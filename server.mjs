import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function resolveFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const candidate = path.resolve(root, relative.startsWith("assets/") ? `public/${relative}` : relative);
  if (!candidate.startsWith(`${root}${path.sep}`) && candidate !== path.join(root, "index.html")) return null;
  return candidate;
}

const server = createServer((request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  const filePath = resolveFile(url.pathname);
  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  createReadStream(filePath).pipe(response);
});

const port = Number(process.env.PORT || 4173);
server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`UX Research Planner is available on port ${port}\n`);
});
