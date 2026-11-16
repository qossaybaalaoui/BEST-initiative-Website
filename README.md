# BEST Initiative Website

Website of **BEST — Benchmarking & Evaluation for Sustainability and Transparency**, a product carbon performance evaluation and benchmarking initiative. It starts with chemicals (ethylene and polyethylene) and will extend to data centers.

## Structure

```
index.html              Home
about/ chemicals/ methods/ benchmarks/ tools/
verification/ value/ resources/ contact/ data-centers/
assets/css/tokens.css   Brand tokens (colours, type, spacing) — edit brand values here
assets/css/base.css     Layout and shared components (buttons, cards, tier chips, header, footer)
assets/js/site.js       Shared header, navigation and footer (menu items live in NAV)
assets/img/             Logo files (open-hexagon mark) and favicon
```

Plain HTML, CSS and JavaScript — no build step. Each page sets `data-root` on `<body>` (`""` for the home page, `"../"` for pages in a folder) so links work on GitHub Pages and locally.

## Preview locally

Open `index.html` in a browser, or run a small server from this folder:

```
python3 -m http.server 8000
```

then visit http://localhost:8000.

## Publish with GitHub Pages

Repository **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder `/ (root)`. The site appears at `https://qossaybaalaoui.github.io/BEST-initiative-Website/`.

## Brand

Logo: open hexagon (chemistry ring / network node) with a rising line breaking out at the top-right corner. Colours: ink `#0B2B2E`, teal `#0F5C55`, leaf `#1E9E68` (BEST tier, Chemicals), mint `#9FDDBF` (BETTER), amber `#D9962B` (GOOD), blue `#2A64C8` (Data Centers). Type: Space Grotesk (headings), Inter (body).
