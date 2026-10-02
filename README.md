# The Austin Air Company

Static website for The Austin Air Company, an HVAC service company for existing homes in Odessa and Midland, Texas.

## Architecture

One page: `index.html`, `src/styles.css`, and `src/site.js`. No framework. `src/site.js` handles the header, the mobile menu, and a few scroll transitions. `npm run build:dev` only copies the static files into `dist/` for the dev site. The page sells service: a Fast / Efficient / Precise spine, services, signs you need a call, how a service call works, tune-ups, why this shop, the service area, a homeowner FAQ, and repeated call-to-action links.

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

The original logo and fleet photograph are in `assets/`, with sources in `assets/SOURCES.md`. Those files are unchanged. AVIF and WebP variants are generated from the fleet photograph, and the fleet photograph is the hero. `credits.html` notes that the fleet photograph and the logo are the company images. An unused stock photograph of an unfinished house remains in the repo and is not shown on the page. Display type is Big Shoulders Display (Patric King, SIL Open Font License 1.1, self-hosted Latin Black) and interface type is Monda, also self-hosted. The Big Shoulders license is `assets/fonts/BigShoulders-OFL.txt`.

## Deploy

The production domain is theaustinair.com, currently hosted on GoHighLevel. theaustinair.com stays on GoHighLevel. This repo does not change DNS. Canonical and Open Graph URLs can switch to https://www.theaustinair.com/ once Nick confirms a cutover. Until then, leave them unset. Do not add Vercel or GitHub Actions.

The dev page is the Cloudflare Pages project `austin-air-dev` at https://austin-air-dev.pages.dev. It is deployed by copying `index.html`, `credits.html`, `_headers`, `assets/`, and `src/` into a dist folder, then running:

```
npx wrangler pages deploy <dist> --project-name austin-air-dev --branch main
```

Use Node 22 or newer. Wrangler fails on Node 20. Set `CLOUDFLARE_API_TOKEN` in the environment. Never commit the token.

From this repo, `npm run build:dev` cleans and creates `dist/` with exactly those files. `npm run deploy:dev` runs that copy, then `npx wrangler pages deploy dist --project-name austin-air-dev --branch main`. `dist/` is gitignored. The copy does not include tests, `node_modules`, or docs. `deploy:dev` stops with an error if Node is below 22 or `CLOUDFLARE_API_TOKEN` is missing.

`_headers` sends `X-Robots-Tag: noindex, nofollow` for every path. That file is for the dev site only. Remove it, or exclude it from the deploy, at production cutover.

The GoHighLevel page’s other pictures (a condenser pair, a tools flat-lay) are not used here. The fleet photograph and the logo remain the company imagery.
