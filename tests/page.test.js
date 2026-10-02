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

test("self-hosts Big Shoulders Display and does not call Google Fonts", () => {
  const woff = resolve(root, "assets/fonts/big-shoulders-display-latin.woff2");
  const ofl = resolve(root, "assets/fonts/BigShoulders-OFL.txt");
  assert.ok(existsSync(woff), "missing Big Shoulders woff2");
  assert.ok(statSync(woff).size > 1000);
  assert.ok(existsSync(ofl), "missing Big Shoulders OFL");
  assert.match(readFileSync(ofl, "utf8"), /SIL OPEN FONT LICENSE/);
  assert.match(html, /assets\/fonts\/big-shoulders-display-latin\.woff2/);
  assert.match(css, /font-family:\s*"Big Shoulders Display"/);
  assert.match(css, /big-shoulders-display-latin\.woff2/);
  assert.match(css, /font-display:\s*swap/);
  assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic/i);
  assert.doesNotMatch(css, /fonts\.googleapis|fonts\.gstatic/i);
  assert.doesNotMatch(html, /instrument-serif/i);
  assert.doesNotMatch(css, /instrument-serif|Instrument Serif/i);
  assert.ok(!existsSync(resolve(root, "assets/fonts/instrument-serif-latin.woff2")));
});

test("ships responsive fleet variants and prioritizes the hero image", () => {
  const hero = html.match(/<img\b[^>]*data-hero-img[^>]*>/)?.[0] ?? "";
  const heroPicture = html.match(/<picture>[\s\S]*?data-hero-img[\s\S]*?<\/picture>/)?.[0] ?? "";
  assert.match(hero, /fetchpriority="high"/);
  assert.doesNotMatch(hero, /loading="lazy"/);
  assert.doesNotMatch(html, /data-fleet-img|class="fleet-break"/);
  assert.match(hero, /width="4032"/);
  assert.match(hero, /height="3024"/);
  const urls = [...heroPicture.matchAll(/srcset="([^"]+)"/g)].flatMap((match) =>
    match[1].split(",").map((part) => part.trim().split(/\s+/)[0])
  );
  assert.ok(urls.some((url) => url.includes("assets/fleet/") && url.endsWith(".avif")));
  assert.ok(urls.some((url) => url.includes("assets/fleet/") && url.endsWith(".webp")));
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

test("grades the hero for type contrast and requests a sharp mobile crop", () => {
  assert.match(html, /class="kicker-mark">The Austin Air Company</);
  assert.match(html, /class="kicker-place">Odessa, Texas</);
  assert.match(html, /fleet-3840\.avif 3840w/);
  assert.match(html, /sizes="\(max-width: 520px\) 280vw,/);
  assert.match(css, /\.site-header\s*\{[^}]*background:\s*transparent/);
  assert.match(css, /\.site-header\.is-solid,\s*body\.nav-open \.site-header\s*\{[^}]*background:\s*var\(--paper\)/);
  assert.match(css, /\.hero-scrim\s*\{[^}]*linear-gradient\(to right/);
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

test("says why the HVAC matters and closes on the published claim", () => {
  const matters = html.match(/<section class="matters"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(matters, /id="matters"/);
  assert.match(matters, /They feel this[\s\S]*?every day\./);
  assert.match(matters, /Comfort\. Air quality\. Energy bills\. The homeowner feels the HVAC every day\./);
  assert.match(matters, /Drywall goes up\. The ductwork is buried\./);
  assert.match(matters, /A mistake is expensive to fix\./);
  assert.match(matters, /Getting it right at rough-in is the whole game\./);
  assert.match(matters, /Hire the best\. #1 in new-construction HVAC across Odessa &amp; Midland\./);
  assert.match(matters, /href="#contact"/);
  assert.ok(html.indexOf('id="spine"') < html.indexOf('id="matters"'));
  assert.ok(html.indexOf('id="matters"') < html.indexOf('id="phases"'));
});

test("carries the louder v2 sections and the expanded palette", () => {
  assert.match(html, /id="spine"/);
  assert.match(html, /Fast\.[\s\S]*?Efficient\.[\s\S]*?Precise\./);
  assert.match(html, /id="phases"/);
  assert.match(html, /Three phases\.[\s\S]*?One crew\./);
  assert.match(html, />Rough-in</);
  assert.match(html, />Trim-out</);
  assert.match(html, />Final</);
  assert.doesNotMatch(html, />Slab<|>Frame<|>Set<|>Start</);
  assert.match(html, /id="why"/);
  assert.match(html, /The last crew treated the schedule like a suggestion\./);
  assert.match(html, /id="get"/);
  assert.match(html, /A partner who already knows the sequence\./);
  assert.match(html, /id="faq"/);
  assert.match(html, /Ask it straight\./);
  assert.match(html, /mechanical sub <span class="cta-keep">catches up\.<\/span>/);
  assert.match(css, /\.cta-keep\s*\{[^}]*white-space:\s*nowrap/);
  assert.match(html, /Construction photography: Unsplash \(credits\)/);
  assert.match(html, /href="credits\.html"/);
  assert.doesNotMatch(html, /Not an Austin Air project/);
  assert.match(html, /href="#faq"/);
  assert.match(css, /--amber:\s*#e07a2f/);
  assert.match(css, /--sand:\s*#e6d3b0/);
  assert.match(css, /--signal:\s*#ff4d2e/);
  assert.match(css, /@keyframes ticker/);
  assert.match(css, /prefers-reduced-motion: reduce\)[\s\S]*\.marquee-track/);
});

test("every img and source path referenced in the page exists", () => {
  const paths = new Set();
  for (const match of html.matchAll(/<(?:img|source)\b[^>]*>/g)) {
    const tag = match[0];
    for (const attr of tag.matchAll(/\b(?:src|srcset)="([^"]+)"/g)) {
      for (const part of attr[1].split(",")) {
        const url = part.trim().split(/\s+/)[0];
        if (!url || /^(?:https?:|data:|#)/.test(url)) continue;
        paths.add(url);
      }
    }
  }
  assert.ok(paths.size > 10);
  for (const url of paths) assert.ok(existsSync(resolve(root, url)), `missing image ${url}`);
  for (const gone of ["slab", "start", "house"]) {
    for (const name of [`${gone}.jpg`, `${gone}-1280.avif`, `${gone}-1280.webp`, `${gone}-2400.avif`, `${gone}-2400.webp`]) {
      assert.equal(existsSync(resolve(root, "assets/phases", name)), false, `leftover ${name}`);
    }
  }
  assert.ok(existsSync(resolve(root, "assets/phases/frame.jpg")));
  assert.ok(existsSync(resolve(root, "assets/austin-air-fleet.jpeg")));
});

test("phase copy is plain text in one color", () => {
  const phases = html.match(/<section class="phases"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(phases, /Ductwork, lineset, condensate drains, and control wire\. Run before insulation and drywall\./);
  assert.match(phases, /Equipment is set\. Registers, grilles, thermostat, and the final connections\. After drywall and paint\./);
  assert.match(phases, /Start-up\. Checks\. An inspection-ready handoff\./);
  assert.match(phases, /assets\/phases\/frame\.jpg/);
  assert.doesNotMatch(phases, /assets\/phases\/(?:slab|start|house)/);
  assert.doesNotMatch(phases, /<(?:mark|em|strong|span|b|i)\b/i);
  assert.match(css, /\.phase-copy p\s*\{[^}]*color:\s*inherit/);
  assert.doesNotMatch(css, /\.phase-copy p\s*\{[^}]*color:\s*var\(--paper\)/);
  assert.match(css, /\.phase-trim\s*\{[^}]*background:\s*var\(--amber\)/);
  assert.match(css, /\.phase-final\s*\{[^}]*background:\s*var\(--signal\)/);
  assert.match(css, /\.marquee\s*\{[^}]*background:\s*var\(--navy\)/);
  assert.match(css, /\.marquee\s*\{[^}]*color:\s*var\(--paper\)/);
  assert.match(css, /\.marquee span\s*\{[^}]*-webkit-text-stroke:\s*0\.02em var\(--amber\)/);
  assert.match(css, /\.phases-intro p,\s*\.phase-copy p,[\s\S]*?transform:\s*translateZ\(0\)/);
  assert.match(css, /\.faq summary\s*\{[^}]*display:\s*list-item/);
  assert.doesNotMatch(css, /\.faq summary\s*\{[^}]*display:\s*flex/);
  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--paper\)/);
  assert.match(css, /:focus-visible\s*\{[^}]*box-shadow:\s*0 0 0 3px var\(--navy\)/);
  assert.match(css, /\.site-header\.is-hidden\s*\{[^}]*translateY\(-110%\)/);
});

test("visible copy has no digits beyond verified facts and phase labels", () => {
  const visible = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  // #1 and 7+ are the only extra digits, and only inside owner-published
  // phrases confirmed on https://www.theaustinair.com/ :
  // "#1 Residential New Construction HVAC in Odessa & Midland."
  // "on time without fail for over 7 years."
  const allowed = ["+14326141927", "432", "614", "1927", "6820", "79762", "8am", "5pm", "01", "02", "03", "04", "#1", "7+"];
  let stripped = visible;
  for (const token of allowed) stripped = stripped.split(token).join(" ");
  assert.doesNotMatch(stripped, /\d/, `unexpected digit in visible copy: ${stripped.match(/\d+/g)}`);
  assert.match(html, /#1 in <span class="claim-keep">new-construction HVAC<\/span> across Odessa &amp; Midland\./);
  assert.match(html, /On time, without fail, 7\+ years running\./);
  assert.doesNotMatch(html, /best in the country/i);
  assert.doesNotMatch(html, /2015/);
});
