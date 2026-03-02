---
name: seo-and-metadata
description: Apply SEO and metadata best practices for the TREND React SPA on GitHub Pages.
---

# SEO & Metadata Skill

## When to Use

- Adding a new page or route
- Adjusting titles or descriptions
- Updating business info (hours, phone, rating)

## Steps for a New Page

1. Add SEO translations in `src/translations/index.js` under `translations.seo`:
   - `newPageTitle` (EN/BG)
   - `newPageDescription` (EN/BG)

2. In the page component, call `usePageSEO`:

```jsx
usePageSEO({
  title: t(translations.seo.newPageTitle),
  description: t(translations.seo.newPageDescription)
})
```

3. Add the route to `public/sitemap.xml`

## usePageSEO Updates

The hook updates: `document.title`, meta description, OG tags, Twitter cards, `og:url`, and canonical link.

## Structured Data

JSON-LD in `index.html` includes:
- HairSalon entity, address, phone (+359888599590)
- `aggregateRating` (5.0, 57 reviews)
- Service catalog (EUR only)

Update when business info changes.

## Google Reviews

- Hardcoded in `src/data/reviews.js`
- `RatingBadge` and `ReviewsCarousel` components display them
- Update `reviews.js` and `aggregateRating` in `index.html` when new reviews come in

## On-Page Checklist

- `usePageSEO` with unique title + description (required)
- One `<h1>` per page
- Meaningful `alt` text on images
- Internal `<Link>` navigation
- `loading="lazy"` on non-critical images
- Stable layout (no CLS)

## Static SEO Files

- `public/robots.txt` -- crawl rules
- `public/sitemap.xml` -- all routes with priority
