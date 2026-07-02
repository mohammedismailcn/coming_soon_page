# Properdeal Coming Soon

React/Vite coming-soon page for `properdeal.in` with the migrated animated water background and property-network visual layer.

## Local development

```bash
npm install
npm run dev
```

The dev server runs at `http://127.0.0.1:5173` by default.

## Build

```bash
npm run build
```

Production files are generated in `dist/`.

## Cloudflare Pages

Use these settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

## Files

- `index.html` - Vite HTML entry
- `main.tsx` - React entry point
- `App.tsx` - migrated page content and interactions
- `RiverBackground.tsx` - Three.js water shader background
- `HeroNetwork.tsx` and related files - animated property network layer
- `styles.css` - layout, responsive styling, and animation styles
- `assets/` - logo and favicon assets