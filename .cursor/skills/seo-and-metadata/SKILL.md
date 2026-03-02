---
name: seo-and-metadata
description: Apply SEO and metadata best practices for the TREND React SPA on GitHub Pages.
---

# SEO & Metadata Skill

## When to Use

- Adding a new page or route
- Adjusting titles or descriptions
- Tuning performance with SEO in mind

## Steps for a New Page

1. Add SEO translations in `src/translations/index.js` under `translations.seo`:
   - `newPageTitle`
   - `newPageDescription`
2. In the page component, call `usePageSEO` with translated strings:

```jsx
usePageSEO({
  title: t(translations.seo.newPageTitle),
  description: t(translations.seo.newPageDescription)
})
```

3. Ensure the page has clear headings and internal links.

## On-Page Checklist

- Meaningful `title` and `description` via `usePageSEO`
- One main `<h1>`; structured `<h2>`/`<h3>` for sections
- `<img>` tags use appropriate `alt` attributes
- Important pages linked from the homepage and/or navigation

## Performance Checklist (SEO-Relevant)

- Avoid layout shifts:
  - Use fixed heights/aspect ratios for hero, sliders, and galleries
- Lazy-load non-critical images:
  - `loading="lazy"` on gallery or secondary images
- Keep JS bundles reasonably small:
  - Split non-essential routes or feature areas if they grow large

