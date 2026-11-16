---
name: trend-ga-pass
description: Audit the TREND Hair Boutique Studio site for Google Analytics 4 event coverage — list interactive elements (BookingButton, tel: phone links, Instagram links, EN/BG language toggle, Stories viewer open/close/advance, Gallery image taps, Contact form) that lack `trackEvent` calls from `src/lib/analytics.js`, and propose event names with sensible params — the dedicated CTA events (`book_now_click`, `call_click`, `instagram_follow_click` via `src/lib/ctaTracking.js`) for Book / phone / Instagram, GA4-conventional names (`contact`, `select_content`, `language_switch`, `generate_lead`) for everything else. Use when the user says "analytics pass", "ga pass", "tracking review", "/trend-ga-pass", or asks why a click isn't showing up in GA4. Also flag the hardcoded fallback measurement ID and missing Consent Mode v2.
---

# TREND GA pass

Focused analytics review of the TREND Hair Boutique Studio site. Full lens in memory `lens-analytics.md`. Project context in `CLAUDE.md`.

## Inputs

- Default scope: every interactive element across the site (or a specific component if user names one).

## Checklist

1. **Track setup.** Open `src/lib/analytics.js`. Verify `VITE_GA_MEASUREMENT_ID` is the only source — flag any hardcoded fallback ID. Verify `initAnalytics()` runs once at app boot and `trackPageView` fires on route change in `src/App.jsx`.
2. **Inventory interactive elements.** Walk these and check for `trackEvent` calls:
   - Every Book CTA (`BookingButton`, `BookingLink`, raw Studio24 links) — `trackBookClick(location)` → `book_now_click`.
   - Every `tel:` link — `trackCallClick(location)` → `call_click`.
   - Every Instagram profile link — `trackInstagramClick(location)` → `instagram_follow_click`.
   - These three are the owner's headline numbers in GA4: flag any Book / tel: / Instagram link that calls `trackEvent` directly or under another name, and any `location` value already used by another button of the same kind.
   - Language toggle in `NavigationView.jsx` (~lines 94-101) — should fire `language_switch` with `{ language: 'en' | 'bg' }`.
   - Stories open/advance/close in `StoriesHighlights.jsx`/`StoriesViewer.jsx` — `select_content` on open, `view_complete` on full progress.
   - Gallery image taps in `GalleryView.jsx` — `select_content` with `{ content_type: 'gallery_image', item_id }`.
   - Contact form submit (if any) — `generate_lead`.
3. **Event names.** Book / Call / Instagram use the `ctaTracking.js` names above. Everything else sticks to GA4 conventions: `contact` (Viber, email), `select_content`, `language_switch`, `generate_lead` (a booking actually submitted), `view_item`, `view_promotion`. Custom names should be `snake_case`.
4. **Params.** Always include `location` (header/footer/sticky_bar/stories_cta/etc.) and `language` (current EN/BG) where relevant.
5. **Consent.** Check whether tracking respects a consent banner. If none exists yet, flag as a privacy gap (Bulgaria/EU = GDPR applies).

## Output

Two tables:
- **Uninstrumented elements** — file:line, suggested event name, suggested params.
- **Setup issues** — hardcoded ID, missing consent, page-view config.

Ask before wiring events.
