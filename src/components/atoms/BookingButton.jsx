import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useBookingTarget } from '../../hooks/useBookingTarget'
import { trackEvent } from '../../lib/analytics'

/**
 * Booking CTA whose width is the maximum of the translated labels in all
 * supported languages, so switching language never reflows surrounding layout.
 *
 * Destination follows the experimental toggle (useBookingTarget): Studio24 by
 * default, the in-site `/book` wizard when `?experimental=booking` is active.
 * Pass an explicit `url` to force an external link regardless (e.g. a hard
 * Studio24 fallback).
 *
 * Pass `translations` (e.g. `translations.hero.bookBtn`, an object keyed by
 * language code) — the active language is shown, the others are rendered
 * invisibly in the same grid cell to size the button. Backwards-compatible:
 * a plain `text` prop still works for one-off callers.
 *
 * `location` (e.g. 'hero', 'sticky_bar', 'footer') is sent as an analytics
 * param so we can attribute bookings to surface.
 */
export const BookingButton = memo(({ translations, text, url, className = '', location = 'unknown' }) => {
  const { lang, t } = useLanguage()
  const target = useBookingTarget()
  const external = url ? true : target.external
  const href = url || target.href

  const handleClick = () => {
    if (external) trackEvent('generate_lead', { method: 'booking_link', location, language: lang })
    else trackEvent('select_content', { content_type: 'booking', location, language: lang })
  }

  const label = translations ? (
    <>
      {Object.keys(translations).map(code => (
        <span
          key={code}
          className={code === lang ? 'btn__label' : 'btn__label btn__label--ghost'}
          aria-hidden={code === lang ? undefined : 'true'}
        >
          {translations[code]}
        </span>
      ))}
      {/* Make screen readers read the active label only */}
      <span className="sr-only">{t(translations)}</span>
    </>
  ) : (
    text
  )

  const btnClass = `btn btn-primary ${translations ? 'btn--stable ' : ''}${className}`

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={btnClass} onClick={handleClick}>
        {label}
      </a>
    )
  }

  return (
    <Link to={target.to} className={btnClass} onClick={handleClick}>
      {label}
    </Link>
  )
})
