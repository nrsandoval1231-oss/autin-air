# The Austin Air Company

Static website for The Austin Air Company, a residential new-construction HVAC contractor serving builders in Odessa and Midland, Texas.

## Architecture

One page: `index.html`, `src/styles.css`, and `src/site.js`. No framework and no build step. `src/site.js` handles the header, the mobile menu, and a few scroll transitions.

`src/form.js` validates a service-request form and can post JSON to a delivery endpoint. It is not mounted. No endpoint has been confirmed, so the page does not show a form.

## Local run

From the repo root:

```
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Tests

```
npm test
npm run check
```

`npm test` runs the Node test suite. `npm run check` syntax-checks the JavaScript.

## Validation

Check the page in a browser at 1440, 1280, 768, 430, 390, 375, and 320. Confirm there is no horizontal overflow, the mobile menu works from the keyboard, phone and email links use `tel:` and `mailto:`, focus is visible, `prefers-reduced-motion` keeps every section readable, and the hero uses the responsive fleet image.

## Assets

The original logo and fleet photograph are in `assets/`, with sources in `assets/SOURCES.md`. Those files are unchanged. AVIF and WebP variants are generated from the fleet photograph. Display type is Instrument Serif and interface type is Monda, both self-hosted.

## Deploy

Not configured. The site is static HTML, CSS, JavaScript, and images. If a host is added later, use Cloudflare. Do not add Vercel or GitHub Actions. Set the canonical URL and absolute social-image URLs only after the production URL is confirmed.
