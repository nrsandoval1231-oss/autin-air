const clamp01 = (value) => Math.min(1, Math.max(0, value));

/** Hero type recedes and the image shifts only a few pixels. */
export function heroMotion(progress) {
  const p = clamp01(progress);
  const fade = Math.min(1, p / 0.55);
  return {
    copyY: Math.round(-12 * fade * 100) / 100 || 0,
    copyOpacity: Math.round((1 - 0.92 * fade) * 1000) / 1000,
    imageY: Math.round(10 * p * 100) / 100 || 0,
  };
}

/** Fleet frame eases from 94% to full size as it enters. */
export function fleetScale(entry) {
  const t = clamp01(entry);
  return Math.round((0.94 + 0.06 * t) * 10000) / 10000;
}

export function openerProgress(rectTop, openerHeight, viewHeight) {
  const range = openerHeight - viewHeight;
  if (range <= 0) return 0;
  return clamp01(-rectTop / range);
}

export function fleetEntry(rectTop, viewHeight) {
  if (viewHeight <= 0) return 0;
  return clamp01((viewHeight - rectTop) / (viewHeight * 0.75));
}

export function applyHeroMotion(copy, img, progress, reduced) {
  if (reduced) {
    copy.style.transform = "";
    copy.style.opacity = "";
    img.style.transform = "";
    return;
  }
  const motion = heroMotion(progress);
  copy.style.transform = `translate3d(0, ${motion.copyY.toFixed(2)}px, 0)`;
  copy.style.opacity = motion.copyOpacity.toFixed(3);
  img.style.transform = `translate3d(0, ${motion.imageY.toFixed(2)}px, 0)`;
}

export function applyFleetScale(img, entry, reduced) {
  if (reduced) {
    img.style.transform = "";
    return;
  }
  img.style.transform = `scale(${fleetScale(entry).toFixed(4)})`;
}

export function bindHeader(header, win) {
  const update = () => header.classList.toggle("is-solid", win.scrollY > 12);
  update();
  win.addEventListener("scroll", update, { passive: true });
  return update;
}

export function bindNav(doc, win) {
  const toggle = doc.querySelector("[data-nav-toggle]");
  const nav = doc.querySelector("#site-nav");
  if (!toggle || !nav) return;
  const mq = win.matchMedia("(max-width: 899px)");
  const mobile = () => mq.matches;
  const links = () => [...nav.querySelectorAll("a")];
  const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    nav.classList.toggle("is-open", open);
    doc.body.classList.toggle("nav-open", open && mobile());
    if (open && mobile()) {
      nav.setAttribute("role", "dialog");
      nav.setAttribute("aria-modal", "true");
    } else {
      nav.removeAttribute("role");
      nav.removeAttribute("aria-modal");
    }
  }

  toggle.addEventListener("click", () => {
    const open = !isOpen();
    setOpen(open);
    if (open && mobile()) links()[0]?.focus();
  });

  doc.addEventListener("keydown", (event) => {
    if (!isOpen() || !mobile()) return;
    if (event.key === "Escape") {
      setOpen(false);
      toggle.focus();
      return;
    }
    if (event.key !== "Tab") return;
    const items = [toggle, ...links()];
    const active = doc.activeElement;
    const last = items.at(-1);
    if (event.shiftKey && active === toggle) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      toggle.focus();
    }
  });

  nav.addEventListener("click", (event) => {
    if (mobile() && event.target.closest?.("a")) setOpen(false);
  });

  mq.addEventListener?.("change", () => {
    if (!mobile()) setOpen(false);
  });
}

export function bindCurrent(nav, doc, win) {
  if (!win.IntersectionObserver) return;
  const pairs = [...nav.querySelectorAll('a[href^="#"]')]
    .filter((link) => !link.classList.contains("nav-phone"))
    .map((link) => [link, doc.querySelector(link.getAttribute("href"))])
    .filter((pair) => pair[1]);
  if (!pairs.length) return;
  const mark = (id) => {
    for (const [link] of pairs) {
      if (link.getAttribute("href") === `#${id}`) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
  };
  const observer = new win.IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) mark(visible.target.id);
  }, { rootMargin: "-40% 0px -45% 0px", threshold: [0.1, 0.25, 0.5] });
  pairs.forEach(([, section]) => observer.observe(section));
}

export function bindMotion(doc, win) {
  const reduce = win.matchMedia("(prefers-reduced-motion: reduce)");
  const opener = doc.querySelector("[data-opener]");
  const copy = doc.querySelector("[data-hero-copy]");
  const heroImg = doc.querySelector("[data-hero-img]");
  const fleetImg = doc.querySelector("[data-fleet-img]");
  const reveals = [...doc.querySelectorAll("[data-reveal]")];

  const apply = () => {
    const reduced = reduce.matches;
    if (reduced) {
      doc.documentElement.classList.remove("motion");
      reveals.forEach((el) => el.classList.add("is-in"));
      if (copy && heroImg) applyHeroMotion(copy, heroImg, 0, true);
      if (fleetImg) applyFleetScale(fleetImg, 1, true);
      return;
    }
    doc.documentElement.classList.add("motion");
  };

  apply();
  reduce.addEventListener?.("change", () => {
    apply();
    if (!reduce.matches) onScroll();
  });

  function onScroll() {
    if (reduce.matches) return;
    if (opener && copy && heroImg) {
      const rect = opener.getBoundingClientRect();
      applyHeroMotion(copy, heroImg, openerProgress(rect.top, opener.offsetHeight, win.innerHeight), false);
    }
    if (fleetImg) {
      const frame = fleetImg.closest("section")?.getBoundingClientRect() ?? fleetImg.getBoundingClientRect();
      applyFleetScale(fleetImg, fleetEntry(frame.top, win.innerHeight), false);
    }
  }

  if (reduce.matches) return;

  win.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (!win.IntersectionObserver) {
    reveals.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const observer = new win.IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.35 });
  reveals.forEach((el) => observer.observe(el));
}

export function initSite(doc = document, win = window) {
  const header = doc.querySelector("[data-header]");
  if (header) bindHeader(header, win);
  bindNav(doc, win);
  const nav = doc.querySelector("#site-nav");
  if (nav) bindCurrent(nav, doc, win);
  bindMotion(doc, win);
}

if (typeof document !== "undefined" && document.querySelector?.("[data-header]")) {
  initSite(document, window);
}
