---
name: trend-ga-pass
description: Audit the TREND Hair Boutique Studio site for Google Analytics 4 event coverage — list interactive elements (BookingButton, tel: phone links, Instagram links, EN/BG language toggle, Stories viewer open/close/advance, Gallery image taps, Contact form) that lack `trackEvent` calls from `src/lib/analytics.js`, and propose GA4-conventional event names (`generate_lead`, `contact`, `share`, `select_content`, `language_switch`) with sensible params. Use when the user says "analytics pass", "ga pass", "tracking review", "/trend-ga-pass", or asks why a click isn't showing up in GA4. Also flag the hardcoded fallback measurement ID and missing Consent Mode v2.
---

# TREND GA pass

Focused analytics review of the TREND Hair Boutique Studio site. Full lens in memory `lens-analytics.md`. Project context in `CLAUDE.md`.

## Inputs

- Default scope: every interactive element across the site (or a specific component if user names one).

## Checklist

1. **Track setup.** Open `src/lib/analytics.js`. Verify `VITE_GA_MEASUREMENT_ID` is the only source — flag any hardcoded fallback ID. Verify `initAnalytics()` runs once at app boot and `trackPageView` fires on route change in `src/App.jsx`.
2. **Inventory interactive elements.** Walk these and check for `trackEvent` calls:
   - `src/components/atoms/BookingButton.jsx` — should fire `generate_lead` with `{ location, language }`.
   - `tel:` links in `FooterView.jsx`, `NavigationView.jsx`, `StoriesViewer.jsx` — should fire `contact` with `{ method: 'phone', location }`.
   - Instagram links across `FooterView.jsx`, `NavigationView.jsx`, `GalleryView.jsx`, `StoriesViewer.jsx` — should fire `share` with `{ method: 'instagram', location }`.
   - Language toggle in `NavigationView.jsx` (~lines 94-101) — should fire `language_switch` with `{ language: 'en' | 'bg' }`.
   - Stories open/advance/close in `StoriesHighlights.jsx`/`StoriesViewer.jsx` — `select_content` on open, `view_complete` on full progress.
   - Gallery image taps in `GalleryView.jsx` — `select_content` with `{ content_type: 'gallery_image', item_id }`.
   - Contact form submit (if any) — `generate_lead`.
3. **Event names.** Stick to GA4 conventions: `generate_lead`, `contact`, `share`, `select_content`, `language_switch`, `view_item`, `view_promotion`. Custom names should be `snake_case`.
4. **Params.** Always include `location` (header/footer/sticky_bar/stories_cta/etc.) and `language` (current EN/BG) where relevant.
5. **Consent.** Check whether tracking respects a consent banner. If none exists yet, flag as a privacy gap (Bulgaria/EU = GDPR applies).

## Output

Two tables:
- **Uninstrumented elements** — file:line, suggested event name, suggested params.
- **Setup issues** — hardcoded ID, missing consent, page-view config.

Ask before wiring events.
