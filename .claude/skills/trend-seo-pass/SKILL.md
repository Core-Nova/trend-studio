---
name: trend-seo-pass
description: Audit the TREND Hair Boutique Studio site for SEO health — verify title/meta/canonical/og/twitter on changed routes via `usePageSEO`, bilingual EN+BG translations in `src/translations/index.js` under `seo.*`, image alts in `src/data/imageImports.js` `ALTS` array, JSON-LD `HairSalon` schema in `index.html`, sitemap entries in `public/sitemap.xml`, and hreflang. Use when the user says "seo pass", "seo review", "/trend-seo-pass", or asks to check meta/sitemap/structured data after adding a route, page, or images. Flag missing translations, stale alts, missing sitemap entries, or outdated schema fields (hours, ratings, offers).
---

# TREND SEO pass

Focused SEO review of the TREND Hair Boutique Studio site. Full lens in memory `lens-seo.md`. Project context in `CLAUDE.md`.

## Inputs

- If the user names routes/files, scope there.
- Otherwise scope to `git diff` against `main` (or working tree).

## Checklist

1. **Per-route meta.** Every page component should call `usePageSEO({ title, description })` (defined in `src/hooks/usePageSEO.js`). Check `HomePage`, `GalleryPage`, `ServicesPage`, `AboutPage`, `ContactPage`. Flag new pages missing the hook.
2. **Translations.** Every title/description used in `usePageSEO` should resolve from `src/translations/index.js` `seo.*` keys, and both `en` AND `bg` variants must be present. Flag missing language.
3. **Images / alts.** When images were added/removed in `src/assets/images/`, check that `src/data/imageImports.js` `HERO_LEFT`/`HERO_RIGHT`/`GALLERY` filename arrays, `DIMENSIONS` array, and `ALTS` array are all in sync (per memory `project-image-pipeline`). Alts must be descriptive ("Balayage result at TREND Hair Boutique Studio Sofia"), not generic.
4. **Structured data.** `index.html` JSON-LD `HairSalon` schema — verify `openingHoursSpecification`, `address`, `geo`, `aggregateRating`, `makesOffer` are current. Flag stale review count, missing services, wrong hours.
5. **Sitemap.** `public/sitemap.xml` — every route in `src/App.jsx` should have a `<url>` entry. Flag missing entries; remind that `lastmod` is manual (no build automation yet).
6. **Robots / favicons.** `public/robots.txt`, favicon set, optional `manifest.json` — note if missing.
7. **hreflang.** `index.html` currently aliases en/bg/x-default all to `/`. Until URL-based language routing exists, don't propose per-route hreflang.
8. **Heading hierarchy.** Each page must have exactly one `<h1>`, with `<h2>`/`<h3>` following.

## Output

Three buckets: **Must fix** (broken/missing per-route meta, missing language, stale schema), **Should fix** (generic alts, missing sitemap entry), **Nit**. File:line + proposed change for each.

Ask before applying.
