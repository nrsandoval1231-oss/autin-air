import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const css = readFileSync(resolve(root, "src/styles.css"), "utf8");
const localImagePaths = ["assets/austin-air-logo.png", "assets/austin-air-fleet.jpeg"];

test("page identifies Austin Air and the editorial headline", () => {
  assert.match(html, /The Austin Air Company/);
  assert.match(html, /Built for[\s\S]*?the build\./);
  assert.match(html, /HVAC is one part[\s\S]*?of the build\./);
  assert.match(html, /Residential HVAC for builders across Odessa and Midland\./);
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

test("keeps the original logo and fleet bytes unaltered", () => {
  const hash = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
  assert.equal(hash("assets/austin-air-logo.png"), "06173aba267ff7a432ebfb242375b5655de5f7ff51955c26271813da57e39725");
  assert.equal(hash("assets/austin-air-fleet.jpeg"), "ffc15e1c6ef30d8372e89e054956e55e198e23b33972e6a8e19693fc56e4cf58");
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
  const targets = [...nav.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
  assert.ok(targets.length >= 2);
  for (const target of targets) assert.match(html, new RegExp(`\\bid="${target}"`));
  assert.match(html, /href="#main"/);
  assert.match(html, /id="main"/);
  assert.match(nav, /Capabilities/);
  assert.match(nav, /Process/);
  assert.match(nav, /West Texas/);
  assert.match(nav, /Contact/);
});

test("declares a viewport, skip link, and keyboard-accessible mobile nav", () => {
  assert.match(html, /<meta\s+name="viewport"\s+content="width=device-width, initial-scale=1"\s*\/?>/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /data-nav-toggle[\s\S]*?aria-expanded="false"/);
  assert.match(html, /aria-controls="site-nav"/);
  assert.match(html, /<nav\b[^>]*class="site-nav"/);
  assert.match(css, /:focus-visible/);
});

test("does not present an online request form", () => {
  assert.doesNotMatch(html, /<form\b/i);
  assert.doesNotMatch(html, /Online requests are unavailable/i);
});

test("retains both service cities and regular-weight typography", () => {
  assert.match(html, /Odessa and Midland, Texas/);
  assert.doesNotMatch(css, /font-weight:\s*(?:bold|[5-9]00)/);
  assert.match(css, /font-weight: 400/);
  assert.doesNotMatch(css, /scroll-behavior:\s*smooth/);
});

test("ships responsive fleet variants and prioritizes the hero image", () => {
  const hero = html.match(/<img\b[^>]*data-hero-img[^>]*>/)?.[0] ?? "";
  const fleet = html.match(/<img\b[^>]*data-fleet-img[^>]*>/)?.[0] ?? "";
  assert.match(hero, /fetchpriority="high"/);
  assert.doesNotMatch(hero, /loading="lazy"/);
  assert.match(fleet, /loading="lazy"/);
  assert.match(hero, /width="4032"/);
  assert.match(hero, /height="3024"/);
  const urls = [...html.matchAll(/srcset="([^"]+)"/g)].flatMap((match) =>
    match[1].split(",").map((part) => part.trim().split(/\s+/)[0])
  );
  assert.ok(urls.some((url) => url.endsWith(".avif")));
  assert.ok(urls.some((url) => url.endsWith(".webp")));
  const original = statSync(resolve(root, "assets/austin-air-fleet.jpeg")).size;
  for (const url of urls) {
    const file = resolve(root, url);
    assert.ok(existsSync(file), `missing variant ${url}`);
    assert.ok(statSync(file).size < original / 2, `${url} should be much smaller than the original fleet photo`);
  }
});

test("supports reduced motion and keeps contact links readable on navy", () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.contact-lines a:hover,\s*\.contact-lines a:focus-visible\s*\{[^}]*color:\s*var\(--paper\)/);
  assert.match(html, /<title>[^<]*Austin Air/);
  assert.match(html, /name="description"/);
  assert.match(html, /property="og:title"/);
  assert.doesNotMatch(html, /rel="canonical"/i);
});

test("states the published capabilities, process, and west texas line", () => {
  assert.match(html, /Pre-construction[\s\S]*?Planning\. Coordination\. Requirements\./);
  assert.match(html, /HVAC installation[\s\S]*?Residential heating and cooling systems for new construction\./);
  assert.match(html, /Builder coordination[\s\S]*?Schedule alignment from planning through installation\./);
  assert.match(html, />Plan</);
  assert.match(html, />Coordinate</);
  assert.match(html, />Build</);
  assert.match(html, /Local knowledge\. Builder coordination\. HVAC execution\./);
  assert.match(html, /Let's talk\./);
});
