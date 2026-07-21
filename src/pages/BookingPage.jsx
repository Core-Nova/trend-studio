import { useMemo, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { usePageSEO } from '../hooks/usePageSEO'
import { useBreadcrumbSchema } from '../hooks/useBreadcrumbSchema'
import { useExperimentalBooking } from '../hooks/useBookingTarget'
import { SITE } from '../lib/constants'
import { SectionHeader } from '../components/atoms/SectionHeader'
import { BookingWizard } from '../components/Booking/BookingWizard'

export const BookingPage = () => {
  const { t } = useLanguage()
  const experimental = useExperimentalBooking()

  usePageSEO({
    title: t(translations.seo.bookingTitle),
    description: t(translations.seo.bookingDescription),
  })

  const crumbs = useMemo(
    () => [
      { name: t(translations.nav.home), path: '/' },
      { name: t(translations.booking.title), path: '/book' },
    ],
    [t]
  )
  useBreadcrumbSchema(crumbs)

  // The in-site wizard is a demo — direct visitors without the experimental
  // flag are sent straight to the real Studio24 booking.
  useEffect(() => {
    if (!experimental) window.location.replace(SITE.studio24Url)
  }, [experimental])

  if (!experimental) {
    return (
      <div className="page-content">
        <section className="booking-section">
          <div className="container container--narrow">
            <p className="booking-status" role="status">{t(translations.booking.redirecting)}</p>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="page-content">
      <section className="booking-section">
        <div className="container container--narrow">
          <SectionHeader tag={t(translations.booking.sectionTag)} title={t(translations.booking.title)} />
          <BookingWizard />
        </div>
      </section>
    </div>
  )
}

export default BookingPage
