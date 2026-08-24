import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";

/**
 * Node HTTP wrapper around Next.js.
 *
 * Cursor preview + Next 16 caused ERR_EMPTY_RESPONSE (-324) because:
 * 1. Dev HMR upgrades were closed with no HTTP status line.
 * 2. Production upgrade handler hung on /_next/webpack-hmr.
 * 3. Keep-alive sockets were RST after idle, which Chrome reports as empty response.
 *
 * This listener always emits a valid HTTP response and does not reuse sockets.
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

function closeUpgrade(socket, status, reason) {
  socket.on("error", () => {});
  try {
    socket.write(
      `HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`,
    );
  } catch {
    /* ignore */
  }
  socket.destroy();
}

const server = createServer((req, res) => {
  res.setHeader("Connection", "close");
  handle(req, res, parse(req.url || "/", true));
});

server.keepAliveTimeout = 0;
server.headersTimeout = 60_000;
server.requestTimeout = 120_000;
server.maxRequestsPerSocket = 1;

server.on("upgrade", (req, socket, head) => {
  socket.on("error", () => {});
  if (!dev) {
    closeUpgrade(socket, 426, "Upgrade Required");
    return;
  }
  const origin = Array.isArray(req.headers.origin)
    ? req.headers.origin[0]
    : req.headers.origin;
  const localOrigin =
    origin &&
    origin !== "null" &&
    /localhost|127\.0\.0\.1/i.test(origin);
  if (!localOrigin) {
    closeUpgrade(socket, 403, "Forbidden");
    return;
  }
  try {
    upgradeHandler(req, socket, head);
  } catch {
    closeUpgrade(socket, 403, "Forbidden");
  }
});

server.listen(port, hostname, () => {
  console.log(
    `VoltGrid ready at http://127.0.0.1:${port} (bind ${hostname}, ${dev ? "dev" : "production"})`,
  );
});
