import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";

/**
 * Thin Node HTTP wrapper around Next.js.
 *
 * Cursor's preview proxy and opaque-origin iframes can trip Next 16's
 * cross-site HMR guard, which calls socket.end() without HTTP headers and
 * surfaces in the browser as ERR_EMPTY_RESPONSE (-324).
 *
 * This server:
 * - listens on 0.0.0.0 (reachable by the preview proxy, not just loopback)
 * - uses long keep-alive / header timeouts
 * - always closes upgrades with a valid HTTP status if Next rejects them
 */
const port = Number(process.env.PORT || 43123);
const hostname = process.env.HOST || "0.0.0.0";
const dev = process.argv.includes("--dev");

const app = next({
  dev,
  hostname: "localhost",
  port,
});
const handle = app.getRequestHandler();

await app.prepare();
const upgradeHandler = app.getUpgradeHandler();

const server = createServer((req, res) => {
  handle(req, res, parse(req.url || "/", true));
});

server.keepAliveTimeout = 75_000;
server.headersTimeout = 76_000;
server.requestTimeout = 120_000;
server.timeout = 120_000;

server.on("upgrade", (req, socket, head) => {
  socket.on("error", () => {
    /* preview proxies drop HMR sockets; ignore */
  });
  const origin = Array.isArray(req.headers.origin)
    ? req.headers.origin[0]
    : req.headers.origin;
  const localOrigin =
    !origin ||
    origin === "null" ||
    /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(origin);

  if (!localOrigin) {
    socket.write(
      "HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
    );
    socket.destroy();
    return;
  }

  try {
    upgradeHandler(req, socket, head);
  } catch {
    socket.write(
      "HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
    );
    socket.destroy();
  }
});

server.listen(port, hostname, () => {
  console.log(
    `VoltGrid ready at http://127.0.0.1:${port} (bind ${hostname}, ${dev ? "dev" : "production"})`,
  );
});
