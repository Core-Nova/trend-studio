---
name: build-and-preview
description: Build, preview, and test the TREND website locally. Use when running dev servers, creating production builds, previewing static output.
---

# Build and Preview

## Commands

All commands run from the repository root (`trend-studio/`).

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Opens at `http://localhost:5173` with hot module replacement.

### Production Build

```bash
npm run build
```

Outputs static files to `dist/`. Includes optimized images, JS/CSS bundles, `robots.txt`, `sitemap.xml`, and `404.html` SPA fallback.

### Preview Production Build

```bash
npm run preview
```

Serves `dist/` at `http://localhost:4173`. Do NOT open `dist/index.html` via `file://`.

### Lint & Format

```bash
npm run lint
npx prettier --check .
```

### Tests

```bash
npm test
npm run test:run
```

## Deploy to GitHub Pages

**Automatic**: push to `main`/`master`. GitHub Actions builds and deploys.

## Build Configuration

- `base: '/trend-studio/'` in `vite.config.js`
- Output: `dist/`
- Assets: `dist/assets/`
- Minification: terser
- Source maps: disabled

## Testing Checklist

1. Images load correctly (no broken images)
2. No WebGL or CORS errors in console
3. Language toggle persists across refreshes
4. Mobile (<=768px): No Three.js, stories/crossfade work
5. Desktop: Triangle sliders play in hero and gallery
6. Reviews carousel rotates, rating badge links to Google
7. Phone/Viber links work on mobile
