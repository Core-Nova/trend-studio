import { trackCallClick } from '../../lib/ctaTracking'
import { BookingLink } from '../atoms/BookingLink'

const trackPhone = () => trackCallClick('sticky_bar')

export const StickyBookingView = ({ text, phoneHref, callText }) => (
  <div className="sticky-booking">
    <BookingLink className="sticky-booking__book" location="sticky_bar">
      {text}
    </BookingLink>
    {phoneHref && (
      <a href={phoneHref} className="sticky-booking__call" aria-label={callText} onClick={trackPhone}>
        &#9742;
      </a>
    )}
  </div>
)
