# TREND Hair Boutique Studio - React App

A modern React application for the TREND luxury hairdressing studio website, built with Vite and configured for GitHub Pages deployment.

## Project Overview

This React app recreates the TREND Hair Boutique Studio website with:
- **Bilingual Support**: English and Bulgarian with localStorage persistence
- **Baroque Design**: Gold and white luxury theme
- **Modern Stack**: React 19, Vite 7, and functional programming patterns
- **Static Deployment**: Optimized for GitHub Pages hosting
- **Three.js Triangle Slider**: Signature image transition effect from the original site

## Getting Started

### Prerequisites
- Node.js 20.17+ (or latest LTS)
- npm 10+

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:5173` to view the app.

### Build

Create a production build:

```bash
npm run build
```

The optimized static files will be in the `dist/` folder.

### Preview Build

Preview the production build locally:

```bash
npm run preview
```

## Three.js Triangle Slider ("Spin")

The signature visual effect of the TREND site. Images are broken into hundreds of triangular faces that animate along cubic bezier curves during transitions, creating a dramatic disassembly/assembly effect.

### How It Works

1. A plane geometry is subdivided into triangles using Three.js BAS (Buffer Animation System)
2. Each triangle gets randomized delay, duration, and bezier control points via vertex attributes
3. A custom GLSL vertex shader drives per-triangle animation based on a `uTime` uniform
4. GSAP TweenMax tweens `uTime` from 0 to `totalDuration` over 3 seconds per transition
5. Two `Slide` meshes alternate: one disassembles (out) while the other assembles (in)

### Dependencies (CDN, not npm)

The slider depends on specific legacy versions loaded via script tags in `index.html`:

| Library | Version | Why CDN |
|---|---|---|
| Three.js | r73 | BAS requires the old `THREE.Geometry` API removed in later versions |
| BAS | Custom build | Not published on npm; hosted on CodePen S3 |
| GSAP TweenMax | 1.18 | Provides `TweenMax.to()` for animation tweening |

Do NOT upgrade Three.js or install it via npm. The BAS extension will break.

### Slider Placements

| Location | Dimensions (Three.js units) | Behavior |
|---|---|---|
| Hero left sidebar | 70 x 105 | Auto-cycles through `hero_left` images |
| Hero right sidebar | 70 x 105 | Same, 500ms delayed start |
| Gallery (4 containers) | 120 x 160 | Staggered start, each offset into the image array |

### Mobile Behavior

The Three.js slider is desktop-only. On mobile devices (`<= 768px` or mobile user agent), a CSS crossfade fallback is rendered instead. This avoids WebGL performance issues on low-power devices.

### Slider Module

The canonical slider code lives at `src/lib/slider.js`. It exports two functions:
- `createImageSlider({ container, images, width, height, delay })` -- returns a dispose function
- `createGallerySliders({ containers, images, staggerDelay })` -- returns a dispose function

Wrap these in `useEffect` and return the dispose function for proper cleanup.

### Legacy Files (repo root)

- `slider.js` -- modernized ES module (reference copy, matches `src/lib/slider.js`)
- `slider22.js` -- **legacy/deprecated** IIFE version used by the original vanilla site

## Image Management

### Static Hosting Constraint

This site is deployed to GitHub Pages. The build output must remain small and contain only JS/CSS/HTML. All images are served from external CDN URLs.

### Image Configuration

All image URLs are stored in `src/data/images.json`:

```json
{
  "hero_left": ["https://i.imgur.com/...jpg", ...],
  "hero_right": ["https://i.imgur.com/...jpg", ...],
  "gallery": ["https://i.imgur.com/...jpg", ...]
}
```

### Adding New Images

1. Upload the image to Imgur (or another public CDN that supports CORS)
2. Copy the direct image URL
3. Add the URL to the appropriate array in `src/data/images.json`
4. The slider/gallery will pick it up automatically

### Local Backups

The `public/images/` folder contains local copies of all images organized by section (`hero-left/`, `hero-right/`, `gallery/`). These are for reference and backup only -- they are NOT used in production.

## Architecture Decisions

| Decision | Rationale |
|---|---|
| Three.js r73 via CDN | BAS extension requires old geometry API; not available on npm |
| External image URLs | GitHub Pages has size limits; images on CDN load faster globally |
| Desktop-only sliders | WebGL is too heavy on mobile; CSS crossfade provides smooth fallback |
| `base: './'` in Vite | Relative paths work regardless of the repo name on GitHub Pages |
| No source maps in prod | Smaller deployment, faster page loads |
| Functional components only | Modern React standard, better hook composition |
| No code comments | Self-documenting code with clear naming (project convention) |

## Project Structure

```
react-app/
  public/
    images/            # Local image backups (not used in production)
  src/
    components/        # React components (one per folder)
    contexts/          # React contexts (LanguageContext)
    data/              # JSON data (images.json, services.json)
    hooks/             # Custom hooks (useIsMobile)
    lib/               # Shared modules
      slider.js        # Three.js triangle slider (canonical source)
    translations/      # i18n translation strings
    styles/            # Global styles
    App.jsx            # Root component
    main.jsx           # Entry point
  index.html           # Includes CDN script tags for Three.js/BAS/GSAP
  vite.config.js       # Vite configuration
  package.json
```

## Technology Stack

- **React 19.2**: Latest React with modern hooks
- **Vite 7**: Lightning-fast build tool
- **Three.js r73 + BAS**: Triangle slider effect (CDN)
- **GSAP TweenMax 1.18**: Animation tweening (CDN)
- **ESLint**: Code quality and consistency
- **CSS Variables**: For theming (baroque gold palette)

## Development Guidelines

### Coding Standards

This project follows strict React best practices enforced by Cursor rules:

1. **Functional Components Only**: Use hooks, no class components
2. **No Code Comments**: Code should be self-documenting
3. **No Emojis in Code**: Use text only
4. **Component Structure**: One component per file, colocated styles
5. **Custom Hooks**: Extract reusable logic
6. **Props Destructuring**: Always destructure props

### Cursor Rules

The project includes Cursor rules in `.cursor/rules/`:

- `react-best-practices.mdc` -- Core React patterns and WebGL cleanup (always active)
- `react-components.mdc` -- Component patterns for .jsx/.tsx files
- `styling-conventions.mdc` -- Baroque gold theme, slider sizing, mobile fallback CSS
- `i18n-patterns.mdc` -- Bilingual support patterns
- `threejs-slider.mdc` -- Three.js triangle slider integration patterns
- `static-hosting.mdc` -- External image URLs and deployment constraints (always active)

## Design System

### Color Palette

```
Gold Primary:  #C9A227
Gold Light:    #D4AF37
Burgundy:      #722F37
White:         #FFFFFF
Cream:         #FAF8F0
Black:         #1A1A1A
Charcoal:      #2C2C2C
```

### Typography

- **Display**: Cormorant Garamond (serif)
- **Body**: Montserrat (sans-serif)

## GitHub Pages Deployment

### Automatic (Recommended)

Push to `main` or `master`. The GitHub Actions workflow builds and deploys automatically.

### Manual

```bash
npm install --save-dev gh-pages
npm run deploy
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run deploy` | Deploy to GitHub Pages |

## Original Project

This React app is based on the TREND Hair Boutique Studio vanilla JS website at the repo root, featuring the Three.js triangle slider, bilingual support, and baroque-inspired design.

## License

Free to use and modify for your business.

---

**TREND -- Where elegance meets artistry**
