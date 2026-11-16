/**
 * The site's three conversion buttons — Book, Call, Instagram — each report
 * under their own GA4 event name, so they show up as three separate rows in
 * GA4 → Reports → Engagement → Events (and can be marked as key events)
 * without any filtering or custom dimensions.
 *
 * Every one carries the same params:
 *   location — which button was clicked ('hero', 'sticky_bar', 'footer', …)
 *   language — the page's language ('bg' | 'en'), read from the URL
 * and Book clicks add
 *   destination — 'studio24' (the live booking site) or 'booking_page' (the
 *                 experimental in-site wizard)
 *
 * Register `location` (and optionally `language`, `destination`) as
 * event-scoped custom dimensions in GA4 to break the counts down by button.
 *
 * Use these for every Book / tel: / Instagram-profile link instead of calling
 * trackEvent directly, so a new button can't drift onto another event name.
 */

import { trackEvent } from './analytics'
import { pathLang } from './routes'

export const CTA_EVENTS = {
  book: 'book_now_click',
  call: 'call_click',
  instagram: 'instagram_follow_click',
}

const pageLanguage = () => pathLang(window.location.pathname)

/** A Book / Book Now / Studio24 link was clicked. */
export function trackBookClick(location, destination = 'studio24') {
  trackEvent(CTA_EVENTS.book, { location, destination, language: pageLanguage() })
}

/** A tel: link was clicked. */
export function trackCallClick(location) {
  trackEvent(CTA_EVENTS.call, { location, language: pageLanguage() })
}

/** A link to the salon's Instagram profile was clicked. */
export function trackInstagramClick(location) {
  trackEvent(CTA_EVENTS.instagram, { location, language: pageLanguage() })
}
