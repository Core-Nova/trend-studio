import { memo } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { trackEvent } from '../../lib/analytics'

const BOOKING_URL = 'https://studio24.bg/hair-boutique-studio-trend-s4258'

/**
 * Booking CTA whose width is the maximum of the translated labels in all
 * supported languages, so switching language never reflows surrounding layout.
 *
 * Pass `translations` (e.g. `translations.hero.bookBtn`, an object keyed by
 * language code) — the active language is shown, the others are rendered
 * invisibly in the same grid cell to size the button. Backwards-compatible:
 * a plain `text` prop still works for one-off callers.
 *
 * `location` (e.g. 'hero', 'sticky_bar', 'footer') is sent as an analytics
 * param so we can attribute bookings to surface.
 */
export const BookingButton = memo(({ translations, text, url = BOOKING_URL, className = '', location = 'unknown' }) => {
  const { lang, t } = useLanguage()

  const handleClick = () => {
    trackEvent('generate_lead', { method: 'booking_link', location, language: lang })
  }

  if (!translations) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`btn btn-primary ${className}`}
        onClick={handleClick}
      >
        {text}
      </a>
    )
  }

  const langs = Object.keys(translations)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn btn-primary btn--stable ${className}`}
      onClick={handleClick}
    >
      {langs.map(code => (
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
    </a>
  )
})
