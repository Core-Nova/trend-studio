import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { useIsMobile } from './useIsMobile'

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

export const useNavigation = () => {
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

  const toggleMenu = () => setMenuOpen(prev => !prev)
  const closeMenu = () => setMenuOpen(false)

  const navItems = useScrollNav
    ? HOME_SCROLL_ITEMS.map(item => ({ ...item, text: t(translations.nav[item.label]) }))
    : PAGE_NAV_ITEMS.map(item => ({ ...item, text: t(translations.nav[item.label]) }))

  return {
    lang,
    changeLanguage,
    isMobile,
    scrolled,
    menuOpen,
    useScrollNav,
    toggleMenu,
    closeMenu,
    navItems,
    bookBtnText: t(translations.hero.bookBtn),
    callText: t(translations.contact.callBtn),
    phoneHref: 'tel:+359888599590',
    currentPath: location.pathname
  }
}
