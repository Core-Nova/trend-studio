import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { SITE } from '../lib/constants'

const STORAGE_KEY = 'trend:experimental-booking'

/**
 * Reads the `?experimental=booking` opt-in. Once seen in the URL it is
 * remembered for the rest of the browser session, so the in-site booking
 * demo stays reachable while navigating (the query string is not carried
 * across SPA links). Falls back to URL-only if sessionStorage is blocked.
 */
function readExperimental(search) {
  const enabledInUrl = new URLSearchParams(search).get('experimental') === 'booking'
  try {
    if (enabledInUrl) sessionStorage.setItem(STORAGE_KEY, '1')
    return enabledInUrl || sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return enabledInUrl
  }
}

/** True when the in-site booking wizard demo is unlocked for this session. */
export function useExperimentalBooking() {
  const { search } = useLocation()
  return useMemo(() => readExperimental(search), [search])
}

/**
 * Where every "Book" CTA should point.
 * Default (everyone): straight out to Studio24. With the experimental flag on,
 * the CTAs route to the in-site `/book` wizard demo instead.
 */
export function useBookingTarget() {
  const external = !useExperimentalBooking()
  return { external, to: '/book', href: SITE.studio24Url }
}
