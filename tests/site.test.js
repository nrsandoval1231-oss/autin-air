import test from "node:test";
import assert from "node:assert/strict";
import {
  applyFleetScale,
  applyHeroMotion,
  bindHeader,
  bindMotion,
  bindNav,
  fleetEntry,
  fleetScale,
  heroMotion,
  openerProgress,
} from "../src/site.js";

test("hero motion stays within a few pixels and fades the type", () => {
  const start = heroMotion(0);
  assert.equal(start.copyY, 0);
  assert.equal(start.imageY, 0);
  assert.equal(start.copyOpacity, 1);
  const end = heroMotion(1);
  assert.ok(end.imageY > 0 && end.imageY <= 12);
  assert.ok(end.copyY < 0 && end.copyY >= -12);
  assert.ok(end.copyOpacity < 0.15);
  assert.ok(heroMotion(0.2).imageY < end.imageY);
  assert.equal(heroMotion(-4).copyOpacity, 1);
  assert.equal(heroMotion(8).imageY, end.imageY);
});

test("fleet scale moves from the mid-90s to full size", () => {
  assert.ok(fleetScale(0) >= 0.92 && fleetScale(0) <= 0.96);
  assert.equal(fleetScale(1), 1);
  assert.equal(fleetScale(-2), fleetScale(0));
  assert.equal(fleetScale(3), 1);
  assert.equal(fleetEntry(0, 800), 1);
  assert.equal(fleetEntry(800, 800), 0);
  assert.equal(openerProgress(0, 1600, 800), 0);
  assert.equal(openerProgress(-800, 1600, 800), 1);
});

test("reduced motion clears hero and fleet transforms", () => {
  const copy = { style: { transform: "translate3d(0, -4px, 0)", opacity: "0.4" } };
  const img = { style: { transform: "scale(0.94)" } };
  applyHeroMotion(copy, img, 1, true);
  applyFleetScale(img, 0.2, true);
  assert.equal(copy.style.transform, "");
  assert.equal(copy.style.opacity, "");
  assert.equal(img.style.transform, "");
  applyHeroMotion(copy, img, 1, false);
  assert.match(copy.style.transform, /translate3d/);
  assert.match(img.style.transform, /translate3d\(0, \d/);
  applyFleetScale(img, 0, false);
  assert.match(img.style.transform, /scale\(0\.94/);
});

function classList() {
  const names = new Set();
  return {
    add: (name) => names.add(name),
    remove: (name) => names.delete(name),
    toggle(name, force) {
      const on = force === undefined ? !names.has(name) : !!force;
      if (on) names.add(name);
      else names.delete(name);
      return on;
    },
    contains: (name) => names.has(name),
  };
}

test("header turns solid after a short scroll", () => {
  const header = { classList: classList() };
  const listeners = {};
  const win = {
    scrollY: 0,
    addEventListener(type, fn) { listeners[type] = fn; },
  };
  bindHeader(header, win);
  assert.equal(header.classList.contains("is-solid"), false);
  win.scrollY = 40;
  listeners.scroll();
  assert.equal(header.classList.contains("is-solid"), true);
  win.scrollY = 0;
  listeners.scroll();
  assert.equal(header.classList.contains("is-solid"), false);
});

test("header hides while scrolling down and returns while scrolling up", () => {
  const header = { classList: classList(), contains() { return false; } };
  const listeners = {};
  const win = {
    scrollY: 0,
    addEventListener(type, fn) { listeners[type] = fn; },
  };
  const doc = {
    activeElement: null,
    body: { classList: classList() },
    addEventListener() {},
  };
  bindHeader(header, win, doc);
  win.scrollY = 200;
  listeners.scroll();
  assert.equal(header.classList.contains("is-hidden"), true);
  assert.equal(header.classList.contains("is-solid"), true);
  win.scrollY = 120;
  listeners.scroll();
  assert.equal(header.classList.contains("is-hidden"), false);
});

test("header stays shown for reduced motion, focus inside, and an open menu", () => {
  const header = { classList: classList(), contains() { return false; } };
  const listeners = {};
  const reduce = { matches: true, addEventListener() {} };
  const win = {
    scrollY: 0,
    matchMedia() { return reduce; },
    addEventListener(type, fn) { listeners[type] = fn; },
  };
  const doc = {
    activeElement: null,
    body: { classList: classList() },
    addEventListener() {},
  };
  bindHeader(header, win, doc);
  win.scrollY = 300;
  listeners.scroll();
  assert.equal(header.classList.contains("is-hidden"), false);
  reduce.matches = false;
  header.contains = () => true;
  win.scrollY = 480;
  listeners.scroll();
  assert.equal(header.classList.contains("is-hidden"), false);
  header.contains = () => false;
  doc.body.classList.add("nav-open");
  win.scrollY = 700;
  listeners.scroll();
  assert.equal(header.classList.contains("is-hidden"), false);
});

test("mobile menu opens, traps tab, closes on escape, and closes from a link", () => {
  const toggle = {
    attrs: { "aria-expanded": "false" },
    classList: classList(),
    setAttribute(key, value) { this.attrs[key] = value; },
    getAttribute(key) { return this.attrs[key] ?? null; },
    focus() { doc.activeElement = this; },
    addEventListener(type, fn) { this.listeners[type] = fn; },
    listeners: {},
  };
  const link = {
    classList: classList(),
    focus() { doc.activeElement = this; },
    closest(selector) { return selector === "a" ? this : null; },
  };
  const nav = {
    classList: classList(),
    attrs: {},
    links: [link],
    setAttribute(key, value) { this.attrs[key] = value; },
    getAttribute(key) { return this.attrs[key] ?? null; },
    removeAttribute(key) { delete this.attrs[key]; },
    querySelectorAll() { return this.links; },
    addEventListener(type, fn) { this.listeners = { ...(this.listeners || {}), [type]: fn }; },
  };
  const doc = {
    activeElement: null,
    body: { classList: classList() },
    listeners: {},
    querySelector(selector) {
      if (selector === "[data-nav-toggle]") return toggle;
      if (selector === "#site-nav") return nav;
      return null;
    },
    addEventListener(type, fn) { this.listeners[type] = fn; },
  };
  const win = {
    matchMedia() {
      return { matches: true, addEventListener() {} };
    },
  };
  bindNav(doc, win);
  toggle.listeners.click();
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  assert.equal(nav.classList.contains("is-open"), true);
  assert.equal(nav.getAttribute("role"), "dialog");
  assert.equal(doc.body.classList.contains("nav-open"), true);
  assert.equal(doc.activeElement, link);

  let prevented = false;
  doc.listeners.keydown({ key: "Tab", shiftKey: false, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(doc.activeElement, toggle);

  doc.listeners.keydown({ key: "Escape", preventDefault() {} });
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(nav.classList.contains("is-open"), false);
  assert.equal(nav.getAttribute("role"), null);
  assert.equal(doc.activeElement, toggle);

  toggle.listeners.click();
  nav.listeners.click({ target: link });
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(doc.body.classList.contains("nav-open"), false);
});

test("reduced motion reveals sections immediately and skips the motion class", () => {
  const reveal = { classList: classList() };
  const copy = { style: { transform: "x", opacity: "0" } };
  const heroImg = { style: { transform: "x" } };
  const fleetImg = { style: { transform: "x" }, closest() { return null; }, getBoundingClientRect() { return { top: 0 }; } };
  const doc = {
    documentElement: { classList: classList() },
    querySelector(selector) {
      if (selector === "[data-opener]") return { getBoundingClientRect() { return { top: 0 }; }, offsetHeight: 10 };
      if (selector === "[data-hero-copy]") return copy;
      if (selector === "[data-hero-img]") return heroImg;
      if (selector === "[data-fleet-img]") return fleetImg;
      return null;
    },
    querySelectorAll() { return [reveal]; },
  };
  const win = {
    innerHeight: 800,
    matchMedia() { return { matches: true, addEventListener() {} }; },
    addEventListener() { throw new Error("reduced motion should not bind scroll"); },
    IntersectionObserver: class { constructor() { throw new Error("should not observe"); } },
  };
  bindMotion(doc, win);
  assert.equal(doc.documentElement.classList.contains("motion"), false);
  assert.equal(reveal.classList.contains("is-in"), true);
  assert.equal(copy.style.transform, "");
  assert.equal(heroImg.style.transform, "");
  assert.equal(fleetImg.style.transform, "");
});
