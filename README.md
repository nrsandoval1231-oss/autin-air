# The Austin Air Company

Static website for The Austin Air Company, a residential new-construction HVAC contractor serving builders in Odessa and Midland, Texas.

## Architecture

One page: `index.html`, `src/styles.css`, and `src/site.js`. No framework and no build step. `src/site.js` handles the header, the mobile menu, and a few scroll transitions. The page adds a Fast / Efficient / Precise spine, a section on why the HVAC matters, a four-phase build story, why builders switch, what you get, repeated calls to action, and a builder FAQ.

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

The original logo and fleet photograph are in `assets/`, with sources in `assets/SOURCES.md`. Those files are unchanged. AVIF and WebP variants are generated from the fleet photograph. Construction-phase pictures in `assets/phases/` are Unsplash photographs, credited in `assets/SOURCES.md` and on `credits.html`, and are not Austin Air jobs. The Set phase has no photograph. Display type is Big Shoulders Display (Patric King, SIL Open Font License 1.1, self-hosted Latin Black) and interface type is Monda, also self-hosted. The Big Shoulders license is `assets/fonts/BigShoulders-OFL.txt`.

## Deploy

The production domain is theaustinair.com, currently hosted on GoHighLevel. This repo does not change DNS or hosting. Canonical and Open Graph URLs can switch to https://www.theaustinair.com/ once Nick confirms a cutover. Until then, leave them unset. If a host is added later, use Cloudflare. Do not add Vercel or GitHub Actions.

The GoHighLevel page’s other pictures (a condenser pair, a tools flat-lay) are not used here. The fleet photograph and the logo remain the company imagery.
