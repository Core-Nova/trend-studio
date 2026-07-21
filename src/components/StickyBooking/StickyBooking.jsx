import { useStickyBooking } from '../../hooks/useStickyBooking'
import { StickyBookingView } from './StickyBookingView'

export const StickyBooking = ({ currentRoute = '/' }) => {
  const { show, text, phoneHref, callText } = useStickyBooking(currentRoute)
  if (!show) return null
  return <StickyBookingView text={text} phoneHref={phoneHref} callText={callText} />
}
