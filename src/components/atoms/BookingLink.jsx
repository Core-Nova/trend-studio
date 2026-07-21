import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useBookingTarget } from '../../hooks/useBookingTarget'
import { trackEvent } from '../../lib/analytics'

/**
 * A "Book" call-to-action that follows the experimental toggle: it links
 * straight to Studio24 by default, or to the in-site `/book` wizard demo when
 * `?experimental=booking` is active (see useBookingTarget).
 *
 * Pass `location` for analytics attribution and an optional `onClick` for
 * side effects like closing a menu — both fire on click.
 */
export const BookingLink = ({ className = '', location = 'unknown', onClick, children, ...rest }) => {
  const { lang } = useLanguage()
  const { external, to, href } = useBookingTarget()

  const handleClick = (e) => {
    if (external) trackEvent('generate_lead', { method: 'booking_link', location, language: lang })
    else trackEvent('select_content', { content_type: 'booking', location, language: lang })
    if (onClick) onClick(e)
  }

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={handleClick} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <Link to={to} className={className} onClick={handleClick} {...rest}>
      {children}
    </Link>
  )
}
