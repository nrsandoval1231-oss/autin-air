import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "..");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

function startServer() {
  const server = createServer(async (req, res) => {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    const rel = url === "/" ? "index.html" : url.replace(/^\/+/, "");
    const path = normalize(join(root, rel));
    if (!path.startsWith(root)) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      const body = await readFile(path);
      res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise((done) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      done({ server, port });
    });
  });
}

test("FAQ summary toggles on both Enter and Space", async () => {
  const { server, port } = await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "domcontentloaded" });
    const summary = page.locator(".faq summary").first();
    await summary.focus();
    const open = () => page.locator(".faq details").first().evaluate((el) => el.open);
    await page.keyboard.press("Enter");
    assert.equal(await open(), true);
    await page.keyboard.press("Enter");
    assert.equal(await open(), false);
    await page.keyboard.press("Space");
    assert.equal(await open(), true);
    await page.keyboard.press("Space");
    assert.equal(await open(), false);
  } finally {
    await browser.close();
    server.close();
  }
});
