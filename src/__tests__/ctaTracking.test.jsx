/**
 * The Book / Call / Instagram buttons each report under their own GA4 event
 * name (book_now_click / call_click / instagram_follow_click) so they are
 * separate rows in GA4's Events report. These lock the names and params in,
 * and check real buttons fire them.
 */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../contexts/LanguageContext'
import { trackEvent } from '../lib/analytics'
import { CTA_EVENTS, trackBookClick, trackCallClick, trackInstagramClick } from '../lib/ctaTracking'
import { BookingButton } from '../components/atoms/BookingButton'
import { StickyBookingView } from '../components/StickyBooking/StickyBookingView'
import { FooterView } from '../components/Footer/FooterView'
import { StoriesViewer } from '../components/Stories/StoriesViewer'

vi.mock('../lib/analytics', () => ({ trackEvent: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  window.history.replaceState(null, '', '/')
})

describe('CTA event helpers', () => {
  it('uses one self-explanatory event name per button type', () => {
    expect(CTA_EVENTS).toEqual({
      book: 'book_now_click',
      call: 'call_click',
      instagram: 'instagram_follow_click',
    })
  })

  it('sends location, page language and (for Book) destination', () => {
    trackBookClick('hero')
    trackCallClick('navbar')
    trackInstagramClick('footer')

    expect(trackEvent.mock.calls).toEqual([
      ['book_now_click', { location: 'hero', destination: 'studio24', language: 'bg' }],
      ['call_click', { location: 'navbar', language: 'bg' }],
      ['instagram_follow_click', { location: 'footer', language: 'bg' }],
    ])
  })

  it('reads the language from the URL', () => {
    window.history.replaceState(null, '', '/en/contact/')
    trackCallClick('contact_section')
    expect(trackEvent).toHaveBeenCalledWith('call_click', { location: 'contact_section', language: 'en' })
  })
})

describe('buttons fire their CTA event', () => {
  const inApp = (ui, url = '/') =>
    render(
      <MemoryRouter initialEntries={[url]}>
        <LanguageProvider>{ui}</LanguageProvider>
      </MemoryRouter>
    )

  it('Book Now → Studio24 by default', () => {
    inApp(<BookingButton translations={{ en: 'Book', bg: 'Запази час' }} location="hero" />)
    screen.getByRole('link').click()
    expect(trackEvent).toHaveBeenCalledWith('book_now_click', {
      location: 'hero',
      destination: 'studio24',
      language: 'bg',
    })
  })

  it('Book Now → the in-site wizard when the experimental flag is on', () => {
    inApp(<StickyBookingView text="Book" phoneHref="tel:+359888599590" callText="Call" />, '/?experimental=booking')
    screen.getByRole('link', { name: 'Book' }).click()
    expect(trackEvent).toHaveBeenCalledWith('book_now_click', {
      location: 'sticky_bar',
      destination: 'booking_page',
      language: 'bg',
    })
  })

  it('sticky Call button', () => {
    inApp(<StickyBookingView text="Book" phoneHref="tel:+359888599590" callText="Call" />)
    screen.getByRole('link', { name: 'Call' }).click()
    expect(trackEvent).toHaveBeenCalledWith('call_click', { location: 'sticky_bar', language: 'bg' })
  })

  it('footer Instagram and Call icons', () => {
    render(<FooterView tagline="" copyright="" year={2026} />)
    screen.getByRole('link', { name: /Instagram/ }).click()
    screen.getByRole('link', { name: /Call/ }).click()
    expect(trackEvent).toHaveBeenCalledWith('instagram_follow_click', { location: 'footer', language: 'bg' })
    expect(trackEvent).toHaveBeenCalledWith('call_click', { location: 'footer', language: 'bg' })
  })

  it('stories viewer CTAs', () => {
    render(
      <StoriesViewer
        images={['a.jpg']}
        currentIndex={0}
        progress={0}
        onClose={() => {}}
        onNext={() => {}}
        onPrev={() => {}}
        onPause={() => {}}
        onResume={() => {}}
        instagramUrl="https://instagram.com/trendbytedi"
        instagramHandle="@trendbytedi"
        phoneHref="tel:+359888599590"
        callText="Call"
      />
    )
    screen.getByRole('link', { name: /trendbytedi/ }).click()
    screen.getByRole('link', { name: /Call/ }).click()
    expect(trackEvent).toHaveBeenCalledWith('instagram_follow_click', { location: 'stories_cta', language: 'bg' })
    expect(trackEvent).toHaveBeenCalledWith('call_click', { location: 'stories_cta', language: 'bg' })
  })
})
