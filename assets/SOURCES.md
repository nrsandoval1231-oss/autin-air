# Austin Air source assets

Retrieved from https://www.theaustinair.com/ on 2026-10-01 for the requested company website redesign. These are existing company-site assets, not newly generated artwork. No formal brand-kit document was found.

- `austin-air-logo.png`: https://assets.cdn.filesafe.space/9T75XgJFsGlRlnGiTbIa/media/62c4b09175f3fa513a966f6c.png
- `austin-air-fleet.jpeg`: https://assets.cdn.filesafe.space/9T75XgJFsGlRlnGiTbIa/media/62c49aabf748aaafc84fd2c7.jpeg

Observed website typography: Poppins headings, Monda body. Observed website colors: primary #104086, secondary #188BF6, red #FF0000, white #FFFFFF, text #101010. The original logo carries darker navy and crimson; preserve its pixels and aspect ratio rather than recoloring or redrawing it. New design tokens derived visually from the logo are design choices, not claimed official brand standards.

Published business details: The Austin Air Company; HVAC service for existing homes in Odessa and Midland, TX; (432) 614-1927; info@TheAustinAir.com; 6820 Austin Ave, Odessa, TX 79762; Monday-Friday 8am-5pm. Do not carry over unverified superiority, tenure, or performance claims. No form-delivery destination has been confirmed.

Derived files, made from those originals without redrawing or recoloring:

- `assets/fleet/fleet-*.avif` and `assets/fleet/fleet-*.webp`: resized copies of `austin-air-fleet.jpeg` for responsive delivery. `fleet-1280.jpg` is the same crop for social meta.
- `assets/logo/logo-*.webp`: resized copies of `austin-air-logo.png`. The header `img` `src` is still the original file.
- `assets/logo/logo-alpha-2x.png` and `logo-alpha-3x.png`: the original mark with a clean alpha edge. Partial-alpha fringe pixels were reassigned to the solid navy or red they belong to, so the edge does not carry a white matte. Opaque white pixels in the red bar are the tagline and were kept. These are the header mark on the cream bar.
- `assets/logo/logo-light-2x.png` and `logo-light-3x.png`: the same alpha mark with navy ink changed to paper (`#f3efe6`). Red and the white tagline are unchanged. These are the header mark over the dark hero. The 2x files are 560 pixels wide and the 3x files are 840, for a slot about 280 CSS pixels wide.
- `assets/favicon.png` and `assets/apple-touch-icon.png`: the original logo scaled uniformly onto a warm-white square. The logo pixels are not recolored.
- `assets/fonts/monda-latin.woff2`: latin subset of Monda (Open Font License), self-hosted, used for body text.
- `assets/fonts/big-shoulders-display-latin.woff2`: latin subset of Big Shoulders Display, the Black instance (weight 900) of the variable font, used for display type. Source: https://github.com/google/fonts/tree/main/ofl/bigshouldersdisplay file `BigShouldersDisplay[wght].ttf`, Version 2.002. Upstream project: https://github.com/xotypeco/big_shoulders. Designer: Patric King. License: SIL Open Font License 1.1, copied at `assets/fonts/BigShoulders-OFL.txt`. No Google Fonts CDN request.

## Unused stock photograph

An earlier page showed one freely licensed stock photograph of an unfinished house. It is not an Austin Air job, not an Austin Air crew, and not Austin Air equipment. It is not displayed on the service site. The fleet photograph and the logo are the only company imagery. `credits.html` says so. The stock files stay in the repo so the license record stays with them.

The photograph is under the [Unsplash License](https://unsplash.com/license). Files under `assets/phases/` were downloaded and resized locally (AVIF and WebP at 1280 and 2400, plus a JPEG fallback). The page does not reference them.

- `frame.jpg` and `frame-1280` / `frame-2400` AVIF and WebP. Unfinished house, walls open. Photographer: Troy Mortier. Source page: https://unsplash.com/photos/a-house-under-construction-with-wooden-framing-kkdfOe0iRu8. Download: https://images.unsplash.com/photo-1676802037786-3697d60497ae. License: Unsplash License.
