import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../translations'
import { useIsMobile } from '../../hooks/useIsMobile'

const HOME_SCROLL_ITEMS = [
  { href: '#home', label: 'home' },
  { href: '#gallery', label: 'gallery' },
  { href: '#about', label: 'about' },
  { href: '#services', label: 'services' },
  { href: '#prices', label: 'prices' },
  { href: '#reviews', label: 'reviews' },
  { href: '#contact', label: 'contact' },
]

const PAGE_NAV_ITEMS = [
  { to: '/', label: 'home' },
  { to: '/gallery', label: 'gallery' },
  { to: '/about', label: 'about' },
  { to: '/services', label: 'services' },
  { to: '/contact', label: 'contact' },
]

export const Navigation = ({ isSubPage = false }) => {
  const { lang, changeLanguage, t } = useLanguage()
  const isMobile = useIsMobile()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const isHomePage = location.pathname === '/'
  const useScrollNav = isHomePage && !isMobile

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (menuOpen && isMobile) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen, isMobile])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const renderNavItems = () => {
    if (useScrollNav) {
      return HOME_SCROLL_ITEMS.map(item => (
        <li key={item.href}>
          <a href={item.href} onClick={() => setMenuOpen(false)}>
            {t(translations.nav[item.label])}
          </a>
        </li>
      ))
    }

    return PAGE_NAV_ITEMS.map(item => (
      <li key={item.to}>
        <Link to={item.to} onClick={() => setMenuOpen(false)}>
          {t(translations.nav[item.label])}
        </Link>
      </li>
    ))
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="logo">TREND</Link>
        <button
          className={`mobile-menu-btn ${menuOpen ? 'active' : ''}`}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
          {menuOpen && isMobile && (
            <li className="nav-links__book-mobile">
              <a
                href="https://studio24.bg"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                onClick={() => setMenuOpen(false)}
              >
                {t(translations.hero.bookBtn)}
              </a>
            </li>
          )}
          {renderNavItems()}
          {menuOpen && isMobile && (
            <li className="nav-links__lang-mobile">
              <div className="lang-toggle">
                <button
                  className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => changeLanguage('en')}
                >EN</button>
                <span className="lang-divider">|</span>
                <button
                  className={`lang-btn ${lang === 'bg' ? 'active' : ''}`}
                  onClick={() => changeLanguage('bg')}
                >BG</button>
              </div>
            </li>
          )}
        </ul>
        <div className="lang-toggle lang-toggle--desktop">
          <button
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => changeLanguage('en')}
          >EN</button>
          <span className="lang-divider">|</span>
          <button
            className={`lang-btn ${lang === 'bg' ? 'active' : ''}`}
            onClick={() => changeLanguage('bg')}
          >BG</button>
        </div>
      </div>
    </nav>
  )
}
