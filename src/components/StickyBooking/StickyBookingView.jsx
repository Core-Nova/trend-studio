import { trackEvent } from '../../lib/analytics'

const trackBooking = () => trackEvent('generate_lead', { method: 'booking_link', location: 'sticky_bar' })
const trackPhone = () => trackEvent('contact', { method: 'phone', location: 'sticky_bar' })

export const StickyBookingView = ({ text, url, phoneHref, callText }) => (
  <div className="sticky-booking">
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="sticky-booking__book"
      onClick={trackBooking}
    >
      {text}
    </a>
    {phoneHref && (
      <a href={phoneHref} className="sticky-booking__call" aria-label={callText} onClick={trackPhone}>
        &#9742;
      </a>
    )}
  </div>
)
