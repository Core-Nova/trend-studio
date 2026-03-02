# React App Setup Complete

This document summarizes the React app setup for the TREND Hair Boutique Studio project.

## What Was Created

### 1. React App with Vite (`/react-app`)

A modern React 19 application using Vite 7 as the build tool, configured for:
- Lightning-fast development with HMR
- Optimized production builds
- GitHub Pages deployment
- Static HTML/CSS/JS output

**Location**: `/react-app/`

### 2. GitHub Pages Configuration

The app is pre-configured for static deployment to GitHub Pages:

**Vite Config** (`react-app/vite.config.js`):
- `base: './'` - Relative paths for assets
- Optimized build settings with minification
- Output directory: `dist/`

**Package Scripts**:
```bash
npm run build      # Build static files
npm run deploy     # Deploy to GitHub Pages (requires gh-pages)
```

**GitHub Actions** (`.github/workflows/deploy.yml`):
- Automatic deployment on push to main/master
- No manual deployment needed

### 3. Cursor AI Rules (`.cursor/rules/`)

Six rule files to guide AI-assisted development:

#### `react-best-practices.mdc` (Always Active)
- Functional programming principles
- Component structure guidelines
- Performance optimization patterns
- No JSDoc comments (per project requirement)
- Vite configuration standards
- CDN dependency guidance (Three.js, BAS, GSAP)
- WebGL resource cleanup patterns

#### `react-components.mdc` (For .jsx/.tsx files)
- Presentational vs Container components
- Custom hooks patterns
- Props destructuring
- List rendering with stable keys
- Event handler conventions

#### `styling-conventions.mdc` (For .css/.jsx/.tsx files)
- Baroque gold & white color palette
- CSS custom properties usage
- BEM-like naming conventions
- Luxury design principles
- Component style colocation
- Slider container sizing (hero 2:3, gallery 3:4)
- Mobile crossfade fallback CSS

#### `i18n-patterns.mdc` (For .jsx/.tsx files)
- Bilingual support (EN/BG)
- Translation hook patterns
- Language context setup
- localStorage persistence
- Dynamic content handling

#### `threejs-slider.mdc` (For .jsx/.tsx/.js files)
- Three.js triangle slider ("spin") architecture
- CDN dependency details (Three.js r73, BAS, GSAP TweenMax)
- React integration via `createImageSlider` / `createGallerySliders` from `src/lib/slider.js`
- Slider placements and dimensions (hero, gallery)
- Transition cycle timing and image loading
- Mobile fallback strategy
- WebGL disposal on unmount
- `slider22.js` marked as legacy/deprecated

#### `static-hosting.mdc` (Always Active)
- GitHub Pages static hosting constraint
- All images must use external CDN URLs (Imgur)
- Image URL management via `src/data/images.json`
- Cross-origin requirements for Three.js and canvas
- Vite build configuration for static output
- What goes where: bundles vs CDN vs local backups

## Quick Start

### Development

```bash
cd react-app
npm install
npm run dev
```

Visit http://localhost:5173

### Build for Production

```bash
npm run build
```

Output in `react-app/dist/` -- ready for static hosting.

### Deploy to GitHub Pages

**Option 1: Automatic (Recommended)**
1. Push to GitHub
2. GitHub Actions will build and deploy automatically
3. Enable Pages in repo settings (Source: gh-pages branch)

**Option 2: Manual**
```bash
npm install --save-dev gh-pages
npm run deploy
```

## Project Context

### Original Site Analysis

The React app is based on the existing TREND website with:

**Design**:
- Baroque-inspired luxury theme
- Gold (#C9A227) and white color palette
- Cormorant Garamond (display) + Montserrat (body)

**Features**:
- Bilingual support (English/Bulgarian)
- Responsive design (mobile-first)
- Three.js animated hero sliders
- Service listings, prices, contact info
- Google Maps integration

**Technical**:
- Pure vanilla JS (original)
- Three.js for animations
- GSAP for tweening
- localStorage for language preference

### Technology Decisions

**Why Vite?**
- Fastest dev experience
- Native ESM support
- Optimal for static builds
- Perfect for GitHub Pages

**Why React 19?**
- Latest features and performance
- Excellent hooks ecosystem
- Component reusability
- Strong TypeScript support (optional)

**Why Functional Components?**
- Modern React standard
- Cleaner code with hooks
- Better for code reuse
- Easier testing

## Static Hosting Constraint

The site deploys to GitHub Pages, which means the `dist/` output must contain only JS, CSS, and HTML. All images are loaded at runtime from external CDN URLs (Imgur).

Key rules:
- All image URLs are stored in `src/data/images.json` -- never hardcode paths to `public/images/`
- The `public/images/` folder is a local backup only, not used in production
- Three.js, BAS, and GSAP are loaded via CDN `<script>` tags in `index.html`, not as npm packages
- External images require `setCrossOrigin('Anonymous')` for Three.js loaders

## Next Steps

### Recommended Implementation Order

1. **Setup Base Structure**
   - Set up global CSS with color variables and typography
   - Add CDN script tags for Three.js, BAS, and GSAP to `index.html`

2. **Create Core Components**
   - Layout components (Header, Footer, Section)
   - Navigation with language toggle
   - Hero section with Three.js slider (desktop) and CSS crossfade (mobile)

3. **Integrate Three.js Slider**
   - The slider module is ready at `src/lib/slider.js` (exports `createImageSlider`, `createGallerySliders`)
   - Create wrapper components that call slider functions inside `useEffect` and return the dispose function
   - Create `ImageCrossfade` mobile fallback component
   - Wire up hero-left, hero-right, and gallery placements

4. **Build Feature Components**
   - Services grid
   - Gallery with 4 staggered Three.js sliders
   - Price tables
   - Contact section with Google Maps embed

5. **Optimize & Deploy**
   - Verify all images load from external CDN URLs
   - Test WebGL disposal (no context leaks)
   - Build and test locally with `npm run preview`
   - Deploy to GitHub Pages

### Alternative Libraries to Consider

**Maps**:
- @react-google-maps/api
- react-leaflet

## File Structure Overview

```
trend-studio/
├── react-app/              # New React application
│   ├── .github/
│   │   └── workflows/
│   │       └── deploy.yml  # GitHub Pages deployment
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # React components (create)
│   │   ├── hooks/         # Custom hooks (create)
│   │   ├── contexts/      # React contexts (create)
│   │   ├── translations/  # i18n files (create)
│   │   ├── lib/          # Shared modules (slider.js)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js     # Vite configuration
│   ├── package.json
│   └── README.md          # Detailed documentation
├── .cursor/
│   └── rules/             # AI development rules
│       ├── react-best-practices.mdc
│       ├── react-components.mdc
│       ├── styling-conventions.mdc
│       ├── i18n-patterns.mdc
│       ├── threejs-slider.mdc
│       └── static-hosting.mdc
├── index.html             # Original vanilla JS site
├── styles.css
├── script.js
├── slider.js              # Modern ES module slider (reference copy)
├── slider22.js            # Legacy IIFE slider (deprecated, used by vanilla site)
├── data/                  # JSON data files
└── images/                # Image assets

```

## Development Guidelines

### Code Style
- Functional components with hooks
- Named exports for components
- Props destructuring
- Custom hooks for logic reuse
- No class components
- No JSDoc comments
- No emojis in code

### Component Pattern
```jsx
import { useState } from 'react'
import './Component.css'

export const Component = ({ title, items }) => {
  const [active, setActive] = useState(false)
  
  return (
    <div className="component">
      <h2>{title}</h2>
      {/* JSX */}
    </div>
  )
}
```

### Styling Pattern
- Colocate CSS with components
- Use CSS custom properties
- BEM-like naming
- Mobile-first responsive

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [GitHub Pages Guide](https://docs.github.com/en/pages)
- Original TREND site: `/index.html`

---

**Status**: Setup Complete - Ready for Development

**Created**: February 4, 2026

**Updated**: February 27, 2026 - Added Three.js slider docs, static hosting constraints, two new Cursor rules, completed slider module at `src/lib/slider.js`, and created `threejs-slider-react` Cursor skill

**Next Action**: Start implementing components following the Cursor rules. The slider module is ready to use.
