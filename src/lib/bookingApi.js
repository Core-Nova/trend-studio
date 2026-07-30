/**
 * Client for the TREND Booking Google Apps Script Web App
 * (see apps-script/README.md for deployment and the full API contracts).
 *
 * Unlike api.js this client never swallows failures into null — booking
 * outcomes must reach the UI. Every function resolves to the endpoint's
 * `{ ok, ... }` JSON, or `{ ok: false, error: 'network' }` on fetch/timeout
 * problems, and never throws.
 *
 * CORS rule: Apps Script cannot answer OPTIONS preflight, so POST bodies are
 * plain strings (fetch defaults to Content-Type: text/plain) and no custom
 * headers are ever set. Apps Script replies via a 302 redirect that fetch
 * follows automatically.
 */

const BOOKING_URL = import.meta.env.VITE_BACKEND_URL || ''

export const bookingEnabled = Boolean(BOOKING_URL)

const NETWORK_ERROR = { ok: false, error: 'network' }

async function request(url, options = {}, timeout = 15000) {
  if (!BOOKING_URL) return NETWORK_ERROR
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    if (!res.ok) return NETWORK_ERROR
    return await res.json()
  } catch {
    return NETWORK_ERROR
  } finally {
    clearTimeout(timer)
  }
}

/** Free slots for a total duration: { ok, timezone, durationMin, days: [...] } */
export function fetchAvailability(durationMin, days = 14) {
  const params = new URLSearchParams({
    action: 'availability',
    duration: String(durationMin),
    days: String(days),
  })
  return request(`${BOOKING_URL}?${params}`)
}

/**
 * Creates the booking: { ok, eventId } or { ok: false, error } where error is
 * one of invalid|invalid_time|outside_hours|slot_taken|rate_limited|
 * busy_try_again|server_error|network.
 */
export function createBooking(payload) {
  return request(BOOKING_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'book', ...payload }),
  })
}

/**
 * Live Google reviews via the Apps Script Places API: { ok, rating, count,
 * reviews: [...] }. Not currently wired into the UI — reviews come from the
 * scraping pipeline (public/reviews.json) — but kept for when the Places API
 * path is enabled again. See apps-script/Reviews.gs.
 */
export function fetchLiveReviews(lang = 'bg') {
  const params = new URLSearchParams({ action: 'reviews', lang })
  return request(`${BOOKING_URL}?${params}`, {}, 8000)
}
