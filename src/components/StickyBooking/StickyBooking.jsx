import { useStickyBooking } from '../../hooks/useStickyBooking'
import { StickyBookingView } from './StickyBookingView'

export const StickyBooking = ({ currentRoute = '/' }) => {
  const { show, text, bookUrl, phoneHref, callText } = useStickyBooking(currentRoute)
  if (!show) return null
  return <StickyBookingView text={text} url={bookUrl} phoneHref={phoneHref} callText={callText} />
}
