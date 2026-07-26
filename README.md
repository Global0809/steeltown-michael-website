# Steeltown Michael — "Side A / Side B" Website

A 3D WebGL e-commerce site for the Steeltown Michael eau de parfum (100ml, two colorways: pink and silver).
Concept: the site is a lost 1970s soul record pressed as a perfume — Side A is the pink bottle, Side B is the silver. The visitor scrolls to fly a camera through a 3D world and flips a 3D vinyl record to choose their colorway.

## Files
- `index.html` — all markup: hero, film sections, Side A/B chapters, turntable commerce section, liner notes, FAQ/sleeve footer.
- `style.css` — full design system. Colors/fonts are CSS variables in `:root` (Side B overrides under `html[data-side="b"]`). Fonts: Bodoni Moda (display), Cormorant Garamond (body), Space Mono (labels), loaded from Google Fonts.
- `main.js` — UI logic: procedural Web Audio sound engine (tape hiss, vinyl crackle, needle drops, flip whoosh — no audio files), side A/B state (localStorage + #side-a/#side-b deep links), custom stylus cursor, kinetic type splitting, marquees, film players with synced chapters, tape counter, DOM fallback galleries (used only if WebGL fails).
- `webgl.js` — the Three.js world (ES module, importmap loads three@0.160 from CDN): shader-displaced silk hero, two corridors of floating campaign frames with glows, light beams, petal/ember/bokeh particle systems, a 3D vinyl that flips on click (front label = pink, back = silver), giant ghost record in the fog, scroll-driven camera path measured from DOM section offsets.
- `assets/` — optimized media (WebP images, H.264 MP4s):
  - `cover.webp` hero banner · `pink-*.webp` / `silver-*.webp` campaign shots (full / boxed / capoff)
  - `film.mp4` 81s soul-era short film (plays in "The Picture Show") · `film-poster.jpg`
  - `boudoir.mp4` 45s vanity film ("The B-Side Reel") · `boudoir-poster.jpg`
  - `hero-loop.mp4` 8s muted neon loop ghosted over the hero

## Run locally
Any static server from this folder, e.g.:
```
npx http-server . -p 8734
```
(A plain file:// open won't work — module scripts and video need HTTP.)

## Commerce
Single PayPal payment link (both colorways): https://www.paypal.com/ncp/payment/ZU5K2273WDMPJ
Buyers state PINK or SILVER in the PayPal order note (explained in the site FAQ).
The buy button is `#buy-link` in index.html; per-side links can be wired in `SIDES` in main.js.

## Known editable placeholders
- Price is not displayed (PayPal page carries it).
- Scent-note "tracklist", brand story, shipping/returns FAQ copy were authored as placeholders — verify before launch.
- Contact email: aicanfeel@gmail.com (in the footer "Write to the Label" link).

## Notes
- External dependencies (CDN): GSAP 3.12 + ScrollTrigger, three@0.160, Google Fonts. Everything else is local.
- Honors `prefers-reduced-motion`; mobile gets reduced particles/DPR and swipe-carousel fallbacks; if WebGL is unavailable the site falls back to a 2D pinned-gallery version automatically.
