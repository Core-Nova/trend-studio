import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { SITE } from '../lib/constants'
import { useIsMobile } from './useIsMobile'

export const useStickyBooking = (currentRoute) => {
  const { t } = useLanguage()
  const isMobile = useIsMobile()
  const [visible, setVisible] = useState(true)
  // Hidden wherever a booking CTA is already on the page: home (hero button),
  // /book (the flow itself), /contact (has its own actions).
  const hasOwnCta = currentRoute === '/' || currentRoute === '/contact' || currentRoute === '/book'

  useEffect(() => {
    if (!isMobile || hasOwnCta) return

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
  }, [isMobile, hasOwnCta])

  return {
    show: isMobile && !hasOwnCta && visible,
    text: t(translations.hero.bookBtn),
    phoneHref: SITE.phoneHref,
    callText: t(translations.contact.phone)
  }
}
