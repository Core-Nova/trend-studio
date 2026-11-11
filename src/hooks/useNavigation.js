import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { SITE } from '../lib/constants'
import { useIsMobile } from './useIsMobile'
import { PATHS } from '../lib/routes'

/* Nav always uses real routes — clicking Gallery/About/Services/Contact
   navigates to the dedicated page instead of scrolling within the home page. */
const PAGE_NAV_ITEMS = [
  { to: PATHS.home, label: 'home' },
  { to: PATHS.gallery, label: 'gallery' },
  { to: PATHS.about, label: 'about' },
  { to: PATHS.services, label: 'services' },
  { to: PATHS.contact, label: 'contact' },
]

export const useNavigation = () => {
  const { lang, changeLanguage, t } = useLanguage()
  const isMobile = useIsMobile()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

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

  const toggleMenu = () => setMenuOpen(prev => !prev)
  const closeMenu = () => setMenuOpen(false)

  const navItems = PAGE_NAV_ITEMS.map(item => ({ ...item, text: t(translations.nav[item.label]) }))

  return {
    lang,
    changeLanguage,
    isMobile,
    scrolled,
    menuOpen,
    toggleMenu,
    closeMenu,
    navItems,
    bookBtnText: t(translations.hero.bookBtn),
    callText: t(translations.contact.callBtn),
    phoneHref: SITE.phoneHref,
    currentPath: location.pathname
  }
}
