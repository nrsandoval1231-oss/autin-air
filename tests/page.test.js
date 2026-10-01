import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const localImagePaths = ["assets/austin-air-logo.png", "assets/austin-air-fleet.jpeg"];

test("page identifies Austin Air and includes the full business name", () => {
  assert.match(html, /The Austin Air Company/);
  assert.match(html, /Built for new homes\. Ready for West Texas\./);
});

test("uses the original logo and fleet image paths, both present on disk", () => {
  for (const path of localImagePaths) {
    assert.ok(html.includes(`src="${path}"`), `expected image path ${path}`);
    assert.ok(existsSync(resolve(root, path)), `missing local image ${path}`);
  }
  const imageSources = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]);
  for (const src of imageSources.filter(path => !/^(?:https?:)?\/\//.test(path))) {
    assert.ok(existsSync(resolve(root, src)), `local img src does not exist: ${src}`);
  }
});

test("provides working phone and email links for the published contact details", () => {
  assert.match(html, /href="tel:\+14326141927"/);
  assert.match(html, /href="mailto:info@TheAustinAir\.com"/);
  assert.match(html, /\(432\) 614-1927/);
  assert.match(html, /info@TheAustinAir\.com/);
  assert.match(html, /6820 Austin Ave[\s\S]*?Odessa, TX 79762/);
  assert.match(html, /Monday–Friday[\s\S]*?8am–5pm/);
});

test("navigation links target existing page sections", () => {
  const nav = html.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? "";
  const targets = [...nav.matchAll(/href="#([^\"]+)"/g)].map(match => match[1]);
  assert.ok(targets.length >= 2);
  for (const target of targets) assert.match(html, new RegExp(`\\bid="${target}"`));
  assert.match(html, /href="#main"/);
  assert.match(html, /id="main"/);
});

test("declares a viewport and makes online request unavailability clear", () => {
  assert.match(html, /<meta\s+name="viewport"\s+content="width=device-width, initial-scale=1"\s*\/?>/);
  assert.match(html, /Online requests are unavailable[\s\S]*?call or email us directly/i);
});

const css = readFileSync(resolve(root, "src/styles.css"), "utf8");
test("retains both service cities and regular-weight typography", () => {
  assert.match(html, /Odessa and Midland, Texas/);
  assert.doesNotMatch(css, /font-weight:\s*(?:bold|[5-9]00)/);
  assert.match(css, /font-weight: 400/);
  assert.doesNotMatch(css, /scroll-behavior:\s*smooth/);
});
