---
name: build-and-preview
description: Build, preview, and test the TREND website locally. Use when running dev servers, creating production builds, previewing static output, or opening the vanilla site.
---

# Build and Preview

## React App

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

Outputs static files to `dist/`. The output should be small -- only JS, CSS, and HTML bundles plus optimized images built by Vite.

### Preview Production Build

```bash
npm run preview
```

Serves the built `dist/` folder at `http://localhost:4173`.

Do NOT use `open dist/index.html` to test the React build. The app uses `<script type="module">` which requires an HTTP server. The `file://` protocol will fail with CORS errors.

### Lint

```bash
npm run lint
```

### Deploy to GitHub Pages

**Automatic**: push to `main` or `master`. GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys automatically.

**Manual**:

```bash
npm install --save-dev gh-pages
npm run deploy
```

## Legacy Vanilla Site (Optional)

If you keep the original vanilla HTML/CSS/JS version (for reference or legacy), it should live under a `legacy/` folder and can be opened directly in a browser using regular `<script>` tags (not ES modules).

## Build Configuration

The React app uses `base: './'` in `vite.config.js` for relative asset paths. This ensures the build works on GitHub Pages regardless of the repository name.

Key settings:
- Output: `dist/`
- Assets: `dist/assets/`
- Minification: terser
- Source maps: disabled

## Testing Checklist

After building or starting the dev server, verify:

1. Images load correctly from the bundled assets (no broken images)
2. No WebGL or CORS errors in browser console
3. Language toggle (EN/BG) persists across page refreshes via localStorage
4. On mobile viewport (<=768px): Three.js sliders do not initialize
5. On desktop: triangle slider transitions play smoothly in hero and gallery sections
