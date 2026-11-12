# TREND Hair Boutique Studio — Website

## Business Context

TREND Hair Boutique Studio is a luxury hair salon in central Sofia, Bulgaria.
- **Address:** 8 Tsar Kaloyan St., Mezzanine, Sofia 1000
- **Phone:** +359 888 599 590
- **Instagram:** [@trendbytedi](https://instagram.com/trendbytedi)
- **Booking:** [studio24.bg/hair-boutique-studio-trend-s4258](https://studio24.bg/hair-boutique-studio-trend-s4258) is what visitors actually get — every Book CTA points there. The in-site `/book` wizard is built but still gated behind `?experimental=booking` (`useExperimentalBooking`), and an ungated visit redirects out to Studio24, so `/book` is excluded from the sitemap and prerender until the flag comes off
- **Email:** trendstudiotedi@gmail.com
- **Domain:** trendbytedi.com
- **Services:** Haircuts, blow dries, coloring (KYDRA by Phyto), hair treatments (ALTERNA, REDKEN), eyelash extensions, special occasion styling
- **Prices in EUR.** Opening hours vary by day (Mon/Wed/Fri 09–19:30, Tue/Thu 10–19, Sat/Sun 09–19).
- **Languages:** English + Bulgarian (bilingual throughout the UI); Bulgarian at `/…`, English at `/en/…`
- **Google rating:** never hardcode the rating or the review count — both are scraped weekly and live in `public/reviews.json` (see Reviews Pipeline). It was 4.9 / 60 in Nov 2026, while the site still showed 5.0 because the scraper defaulted to 5.0 whenever it missed the header.

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | React 19, React Router 7 |
| Build | Vite 7, vite-imagetools 10 (AVIF + WebP srcsets at 480/768/1080/1600w) |
| 3D effects | Three.js r73 + BAS (Buffer Animation System) + TweenMax/GSAP 1.18 — loaded from CDN via `requestIdleCallback`, not npm |
| Hosting | GitHub Pages (`gh-pages -d dist`), SPA with 404.html copy |
| Styling | Modular plain CSS under `src/styles/` (tokens/base/utilities/components/pages/motion), bundled via the `@import` manifest `src/index.css`; no CSS modules or preprocessor |
| Testing | Vitest + happy-dom + @testing-library/react |
| Linting | ESLint 9 + Prettier, lint-staged |
| Image optimization | vite-plugin-image-optimizer (quality 80) + vite-imagetools for responsive variants |

## Project Architecture

```
src/
  App.jsx                  — Router setup, lazy-loaded pages (all except HomePage)
  main.jsx                 — ReactDOM.createRoot entry
  index.css                — @import manifest only; cascade order = tokens → base → utilities → components → pages → motion
  styles/
    tokens.css             — :root design tokens (colors + *-rgb triplets, fonts, shadows)
    base.css               — reset, element defaults, .container, loading, global keyframes
    utilities.css          — .btn* family, .section-header, .sr-only, .scroll-reveal, mobile tiles
    components/*.css       — one file per component (navbar, hero, services, booking, …), responsive rules co-located
    pages.css              — .page-content, 404
    motion.css             — prefers-reduced-motion overrides (must stay the LAST import)
  lib/
    slider.js              — WebGL particle-transition engine (pure JS, no React)
    analytics.js           — GA4 analytics
    bookingApi.js          — Apps Script client (availability, booking; fetchLiveReviews is dormant)
    bookingUtils.js        — Booking selection/validation helpers
    constants.js           — SITE object: phone/viber/Studio24/Instagram/Maps URLs
    routes.js              — PATHS (Bulgarian page URLs, trailing slash), localePath()/pathLang() for the /en/ twins, samePath(); use for every internal link and route check
  hooks/
    useSlider.js           — Generic reusable hook wrapping slider.js lifecycle
    useHeroSliders.js      — Creates 2 desktop sliders (left/right) or 1 mobile slider
    useHero.js             — Hero section data + slider refs
    useStories.js          — Stories viewer state machine (open/close/next/prev/pause/resume + rAF progress bar)
    useGalleryImages.js    — Bundled gallery images + story groups
    useInstagramFeed.js    — Gallery posts: live feed via Apps Script, else bundled photos as posts
    useIsMobile.js         — Responsive breakpoint hook
    useLightbox.js         — Desktop lightbox for gallery
    ...                    — Other section-specific hooks
  data/
    imageImports.js        — vite-imagetools globs, image arrays, dimensions, alt text, STORY_GROUPS
    reviews.js             — Auto-generated review snapshot (fallback + hero badge); do not hand-edit
  components/
    Hero/                  — Hero section with WebGL sliders (desktop: split left/right, mobile: single full-bleed)
    Stories/               — Instagram-style stories viewer (mobile) with WebGL transitions
    Gallery/               — Gallery grid section (home page) — bundled photos, stories viewer / lightbox
    InstagramFeed/         — The gallery page: the salon's Instagram feed in TREND's design
    ImageCrossfade/        — CSS crossfade fallback until WebGL loads
    atoms/                 — ResponsiveImage, SectionHeader, BookingButton, LangLink (language-aware router Link)
    ...                    — Other sections (About, Services, Contact, Reviews, Navigation, Footer, StickyBooking, Booking)
  pages/
    HomePage.jsx           — Eagerly loaded, composes all home sections
    GalleryPage.jsx        — The Instagram feed (InstagramFeed), nothing else
    ServicesPage, AboutPage, ContactPage, NotFoundPage — Lazy-loaded
  contexts/
    LanguageContext.jsx    — EN/BG language, derived from the URL (RoutedLanguageProvider)
  translations/
    index.js               — All UI strings in { en, bg } format
```

## Key Patterns

### Image Pipeline
- Source images live in `src/assets/images/{hero-left,hero-right,gallery}/`
- `src/data/imageImports.js` uses `import.meta.glob` with vite-imagetools queries to generate AVIF/WebP srcsets at build time
- Adding/removing images requires updating the filename arrays (`HERO_LEFT`, `HERO_RIGHT`, `GALLERY`), `DIMENSIONS`, and `ALTS` arrays in `imageImports.js`
- Supports JPG and PNG (`*.{jpg,png}`)
- `ResponsiveImage` component renders `<picture>` with `<source>` for AVIF, WebP, and `<img>` fallback

### WebGL Slider
- Three.js, BAS, and TweenMax are loaded from CDN in `index.html` via `requestIdleCallback` (lazy, non-blocking)
- `slider.js` creates a particle-disintegration transition effect between images
- `useSlider` hook polls for globals (`THREE`, `TweenMax`), dynamically imports `slider.js`, returns `{ ready, controls }` where `controls` is a ref to `{ next, prev, pause, resume, dispose, getCurrentIndex }`
- Main-thread budget (Lighthouse mobile scored 58 with ~10 s blocking before this): the two ~56k-triangle meshes are built after `load` in yielded steps (`buildSlide`), and `THREERoot` draws on demand — every frame only while a transition runs and the canvas is on screen, otherwise single frames via `requestRender()`. Do not reintroduce a permanent rAF loop; anything that changes what the canvas shows must call `requestRender()`
- Works on both desktop and mobile — no UA/viewport guard
- `autoPlay: true` (default) for hero auto-cycling, `autoPlay: false` for stories viewer (manual control)
- `ImageCrossfade` component serves as visible fallback until WebGL is ready, then hides

### Stories Viewer (Mobile)
- Instagram-style fullscreen modal with progress bars, tap zones for prev/next, pause-on-hold
- `useStories` hook manages state: rAF-based progress timer, auto-advance when progress >= 1
- `StoriesViewer` component integrates `useSlider` in manual mode — a `useEffect` watches `currentIndex` changes and calls `controls.current.next()` or `controls.current.prev()` to sync the WebGL slider
- CTA at bottom: phone call button + Instagram pill button with SVG icon
- Story groups defined in `STORY_GROUPS` array in `imageImports.js` — currently single "Gallery" group
- `StoriesHighlights` renders highlight circles in the home Gallery section (mobile only)

### Home Gallery Section
- Bundled photos from `useGalleryImages` (`allImages` + `STORY_GROUPS`); "View Full Gallery" links to `/gallery`
- Mobile: tapping an image opens the stories viewer; desktop: a CSS lightbox (`useLightbox`)

### Gallery Page = Instagram Feed
- `/gallery` renders only `InstagramFeed` (page h1 stays "Gallery"/"Галерия" for SEO and the nav): profile card + Follow button, a grid of up to 12 posts (4 / 3 / 2 columns at >992 / >768 / phone), 4:5 tiles, carousel and reel marks, caption overlay on hover and keyboard focus, every tile linking to the post on Instagram in a new tab
- Data: `useInstagramFeed()` → `fetchInstagramFeed()` (`bookingApi.js`) → Apps Script `?action=instagram`. The browser never calls Instagram and never sees the token
- Until the feed is connected — and whenever the backend is unreachable or returns nothing usable — the hook serves `FALLBACK_POSTS` (the bundled photos, linking to the profile), so the page is never empty. Live posts are cached in `sessionStorage` for 30 min
- Only `https` image and link URLs are rendered (`normalizePosts`), on top of the backend's own filter
- Design reference: the "TREND Instagram Feed" design canvas (claude.ai artifact)

### Booking Backend (Google Apps Script)
- Free serverless backend under trendstudiotedi@gmail.com — availability from Google Calendar + working-hours spreadsheet, event creation with client invites, Studio24 email sync (5-min Gmail poll), declined-invite cleanup (`DeclinedBookings.gs`, own 5-min trigger), the gallery's Instagram feed (`Instagram.gs`: 6-hour sync into the config sheet's "Instagram" tab, weekly token refresh, `?action=instagram`; needs Script Property `IG_TOKEN`), and a reviews endpoint the site does not currently call
- Source in `apps-script/` (one `.gs` per function, copy-pasted into script.google.com); deployment guide in `apps-script/README.md`
- `src/__tests__/appsScript.test.js` runs the pasted bundle in Node against fakes of the Google services (virtual clock, Sofia TZ) — the only way to test the backend without deploying; extend it with every backend change
- Frontend: `/book` wizard (`src/components/Booking/`, `useBookingFlow`, `src/lib/bookingApi.js`); the /exec URL is `SITE.backendUrl` (`src/lib/constants.js`) — a hardcoded public default, overridable via env `VITE_BACKEND_URL`
- CORS constraint: POSTs are text/plain string bodies with NO custom headers (Apps Script can't answer preflight)
- Service durations live in TWO places: `services.json` `minutes` (wizard) and the config spreadsheet's Services tab (Studio24 sync) — keep in sync
- `apps-script/Reviews.gs` (`?action=reviews`) is deployed and routed, but nothing in the UI calls its client `fetchLiveReviews` — reviews come from the scraper instead (see Reviews Pipeline). Keep it working; it is the fallback plan if Google Maps scraping breaks
- Full contracts and gotchas: `.claude/skills/trend-booking-backend/SKILL.md`

### Reviews Pipeline
The rating and review count appear in **four** places, and they silently drifted
apart once already (hero said 50 while the Reviews section said 54). One
scrape now writes all of them — never update any by hand:

| Where | Written by | Read at |
|---|---|---|
| `public/reviews.json` | `scripts/fetch-reviews.mjs` | runtime — `useReviews()` fetches it for the Reviews section |
| `src/data/reviews.js` | same script | build — offline fallback, and the hero `RatingBadge` imports it statically |
| `index.html` JSON-LD `aggregateRating` | same script (`updateSchemaRating`) | build — what Google reads for the star rich-result |
| This file's business-context line | nothing | never — so it carries no number |

- `npm run fetch-reviews` (Playwright, no API key) scrapes the Maps listing and rewrites the first three. None are committed by CI; **both** workflows run it **before** `npm run build`, because the hero badge and the JSON-LD are baked in at build time — only the JSON is fetched at runtime
  - `update-reviews.yml`: every Monday 04:00 UTC or manual dispatch, then deploys
  - `deploy.yml` (every push to main): best-effort (`continue-on-error`). Without it a push deploy ships the committed snapshot and undoes the Monday refresh — that happened in Nov 2026
- GitHub disables a scheduled workflow after 60 days without commits (`update-reviews.yml` was `disabled_inactivity` from Nov 2 2026). Re-enable it in the Actions tab; a push deploy refreshes reviews either way
- The scrape **merges** into the committed snapshot (`mergeReviews`, tested in `fetchReviews.test.js`): Maps only loads ~5–10 reviews, so it adds new reviewers to the front (the carousel shows the first 10) and never drops a known one; known reviewers keep their snapshot date
- The scrape refuses to write a field it did not read (a missed header would otherwise publish a "0 reviews" rich-result to Google)
- `--override` is a no-op kept for backwards compatibility; the default mode already writes everything
- The committed `src/data/reviews.js` is what `npm run dev` and any local build show, so it goes stale between scrapes — that is expected, not a bug

### Bilingual Support
- `LanguageContext` provides `t()`, `lang` and `changeLanguage()`. The language comes from the URL (`/en/...` = English, anything else Bulgarian) — see Prerendering. `LanguageProvider` (state + localStorage) is only the router-less variant for tests
- All strings in `translations/index.js` as `{ en: '...', bg: '...' }`
- `BookingButton` uses `btn--stable` class with `display: inline-grid` to prevent layout shift between languages

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build (copies index.html → 404.html for SPA)
npm run preview      # Preview production build
npm run deploy       # Build + deploy to GitHub Pages
npm run test         # Run vitest in watch mode
npm run test:run     # Run vitest once
npm run lint         # ESLint
npm run format       # Prettier
```

## Important CSS Notes

- Styles live in `src/styles/` — one file per component; `src/index.css` is a pure `@import` manifest whose order defines the cascade (`motion.css` MUST stay last so reduced-motion wins)
- **No duplicate selectors** is the invariant: each selector is defined exactly once, in its owner file; responsive `@media` rules are co-located at the bottom of the same file (descending breakpoint order)
- Alpha colors use RGB-triplet tokens: `rgba(var(--gold-primary-rgb), 0.3)` — never raw channel values (plain black/white shadows may stay literal); all tokens in `src/styles/tokens.css`
- Hero slider containers use `position: absolute; top: 0` (not `90px`) to avoid gap between navbar and hero
- `.hero-mobile-slider` and its canvas fill the parent container absolutely
- `.stories-viewer__cta` has `background: none` — no gradient overlay
- `.page-content` has a `pageEnter` CSS entrance animation (opacity 0 → 1)

## Deployment

- Static site on GitHub Pages via `gh-pages` package
- `vite.config.js` supports `VITE_BASE_PATH` env var for non-root deployments
- Structured data (JSON-LD `HairSalon` schema) in `index.html`

### Prerendering (`scripts/seo-routes.mjs`)
Pages serves a pure SPA, so without this every route returned the 404 fallback
with an empty body — Google saw nothing until its deferred JS-rendering pass.
The script runs after `vite build` and, from a single `ROUTES` table, emits:

- a static page per route **per language** — Bulgarian at
  `dist/<route>/index.html` (the default, URLs unchanged), English at
  `dist/en/<route>/index.html` — the shell with per-route `<head>`
  (title/description/canonical/og, `<html lang>`, `og:locale`, hreflang) **and**
  a semantic body outline in that language
- `dist/sitemap.xml` listing both URLs of every route, each with its
  `xhtml:link` alternates and `<lastmod>` from `git log` on the route's `sources`

Rules:
- **`ROUTES` is the only place to register a route.** There is no
  `public/sitemap.xml` any more; adding a route there covers both outputs in
  both languages (`title`/`description` are `{ en, bg }` nodes, `body(tr)`
  receives the language picker). The React side needs the route in `App.jsx`
  (inside the `/en?` parent) and `PATHS`
- Body builders read `src/translations/index.js` and `src/data/services.json`.
  Never hand-write copy in the script — if the static and React versions
  disagree, widen the data the builder reads
- Injected markup goes inside `#root`; `createRoot()` clears the container on
  mount, so React always wins for real visitors. Do not switch to
  `hydrateRoot` without making the markup match the React tree exactly
- `/` keeps the shell's own hand-written `<head>` (only its language tags are
  set, `applyLocale`) and gets a body; `/en/` gets a generated head like any
  subpage; `dist/404.html` is deliberately left as the bare shell
- The generator throws if a `<head>` tag or `#root` is missing, so a Vite HTML
  output change fails the build instead of shipping a broken page
- **Every page URL ends in a slash** (`/gallery/`) — that is what Pages serves;
  `/gallery` 301s to it. Canonicals, `og:url`, the sitemap, breadcrumbs, the
  static nav and every React `<Link>` use that form. In app code take paths from
  `PATHS` in `src/lib/routes.js` and compare with `samePath()` (a visitor from
  Google is on `/contact/`, never `/contact`) — a bare `'/contact'` string either
  links to a redirect (Search Console: "Page with redirect") or misses the page
- Every prerendered body starts with a plain `<nav>` of all routes in the
  page's own language space, plus a link to the page's other-language URL, so
  the static HTML carries internal links before JS runs
- **The URL is the language.** `/x/` is Bulgarian, `/en/x/` is English
  (`pathLang`/`localePath` in `src/lib/routes.js`, shared by the script and the
  app). `RoutedLanguageProvider` reads it from the location — localStorage never
  overrides it, or a visitor would see English on a URL indexed as Bulgarian —
  and the EN/BG toggle navigates to the page's other URL (same route element via
  the optional `/en?` segment, so no remount; `state.langSwitch` skips the
  scroll-to-top). `PATHS` holds the Bulgarian paths: render internal links with
  the `LangLink` atom (or `localePath(PATHS.x, lang)`), never a bare router
  `<Link>` and never a hand-written `/en/...`. `samePath()` ignores the prefix
- Every page, subpages included, carries the same reciprocal hreflang set on
  both versions: `bg`, `en`, and `x-default` → the Bulgarian URL
  (`alternatesFor`). Each version's canonical and `og:url` are its own URL.
  `usePageSEO` writes the identical values at runtime — change both together.
  `index.html` carries the homepage's set for dev and the 404 shell
- `/book` (and `/en/book`) stays unprerendered and out of the sitemap
- `dist/404.html` is made `noindex` with no canonical (`applyNotFound`): Pages
  serves it as a 200 at `/404.html`
- `src/__tests__/seoRoutesIndexing.test.js` locks these in
- Enforce HTTPS in the repo's Pages settings: if it is off, every page is also
  served (200) over `http://`

## Pending Work

- Stories viewer sync: when the progress bar timer auto-completes, it must trigger the WebGL slider to advance (the `useEffect` in `StoriesViewer` watching `currentIndex` handles this, but needs verification)
- Timer reset on tap: tapping next/prev should reset the progress bar timer (handled by `useStories.next()`/`prev()` which reset `progress` to 0)
