import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { initAnalytics, trackPageView } from './lib/analytics'
import { LanguageProvider } from './contexts/LanguageContext'
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

  useEffect(() => {
    window.scrollTo(0, 0)
    trackPageView(location.pathname)
  }, [location.pathname])

  return (
    <>
      <Navigation />
      <main id="main-content">
        <Suspense fallback={<div className="page-loading"><img src={logoSrc} alt="" className="page-loading__logo" /></div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="*" element={<NotFoundPage />} />
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
    initAnalytics()
    document.dispatchEvent(new Event('app-rendered'))
  }, [])

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRoutes />
    </BrowserRouter>
  )
}

export const App = () => (
  <ErrorBoundary>
    <LanguageProvider>
      <AppShell />
    </LanguageProvider>
  </ErrorBoundary>
)

export default App
