# STEELTOWN MICHAEL

A single-canvas 3D art-installation storefront. Vanilla HTML/CSS/JS — no build tools.

- `index.html` — UI shell (enter gate, brand, price, ACQUIRE button, credit) + CDN imports (Three.js 0.160, GSAP 3.12, Google Fonts: Syncopate + Inter).
- `style.css` — black/white minimalist system; UI is `mix-blend-mode: difference` so it stays legible over both dimensions.
- `script.js` — everything: procedural bottle (cylinder body, torus shoulder, chrome collar, curl-sculpted sphere cap), scroll-driven camera orbit, single-material morph (pink refractive glass → liquid chrome at 50% scroll), starfield, Web Audio drone whose pitch falls with scroll, synthesized hover tick.

Deploy: upload the three files to any static host. Run locally with any static server (module scripts need HTTP).

Checkout: the ACQUIRE THE SCENT button links to PayPal — https://www.paypal.com/ncp/payment/ZU5K2273WDMPJ ($199 USD).
