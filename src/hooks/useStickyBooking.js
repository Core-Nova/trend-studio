import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { useIsMobile } from './useIsMobile'

export const useStickyBooking = (currentRoute) => {
  const { t } = useLanguage()
  const isMobile = useIsMobile()
  const [visible, setVisible] = useState(true)
  const isContactPage = currentRoute === '/contact'

  useEffect(() => {
    if (!isMobile || isContactPage) return

    const contactSection = document.getElementById('contact')
    if (!contactSection) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(contactSection)

    return () => observer.disconnect()
  }, [isMobile, isContactPage])

  return {
    show: isMobile && !isContactPage && visible,
    text: t(translations.hero.bookBtn),
    bookUrl: 'https://studio24.bg/hair-boutique-studio-trend-s4258',
    phoneHref: 'tel:+359888599590',
    callText: t(translations.contact.phone)
  }
}
