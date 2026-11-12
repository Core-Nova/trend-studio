import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { trackPageView } from './lib/analytics'
import { RoutedLanguageProvider } from './contexts/LanguageContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Navigation } from './components/Navigation/Navigation'
import { Footer } from './components/Footer/Footer'
import { StickyBooking } from './components/StickyBooking/StickyBooking'
import { BackToTop } from './components/BackToTop/BackToTop'
import { HomePage } from './pages/HomePage'
import logoSrc from './assets/brand/trend-logo.png?w=200&format=webp&quality=80'

const GalleryPage = lazy(() => import('./pages/GalleryPage'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const BookingPage = lazy(() => import('./pages/BookingPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const AppRoutes = () => {
  const location = useLocation()

  // The language toggle navigates to the same page's other URL
  // (RoutedLanguageProvider): a new page view, but the reader stays put.
  const langSwitch = Boolean(location.state?.langSwitch)

  useEffect(() => {
    if (!langSwitch) window.scrollTo(0, 0)
    trackPageView(location.pathname)
  }, [location.pathname, langSwitch])

  return (
    <>
      <Navigation />
      <main id="main-content">
        <Suspense fallback={<div className="page-loading"><img src={logoSrc} alt="" className="page-loading__logo" /></div>}>
          <Routes>
            {/* "en?" is an optional static segment: every page is served at
                "/x/" (Bulgarian) and "/en/x/" (English) by the SAME route, so
                switching language re-renders the page instead of remounting it.
                The language itself is read from the URL in LanguageContext. */}
            <Route path="/en?">
              <Route index element={<HomePage />} />
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="book" element={<BookingPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <StickyBooking currentRoute={location.pathname} />
      <BackToTop />
    </>
  )
}

const AppShell = () => {
  useEffect(() => {
    // Analytics is initialized eagerly in main.jsx (before render) so the first
    // trackPageView isn't dropped; here we only signal that the app has painted.
    document.dispatchEvent(new Event('app-rendered'))
  }, [])

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <RoutedLanguageProvider>
        <AppRoutes />
      </RoutedLanguageProvider>
    </BrowserRouter>
  )
}

export const App = () => (
  <ErrorBoundary>
    <AppShell />
  </ErrorBoundary>
)

export default App
