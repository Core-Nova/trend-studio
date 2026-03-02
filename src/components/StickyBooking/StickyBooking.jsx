import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../translations'
import { useIsMobile } from '../../hooks/useIsMobile'

export const StickyBooking = ({ currentRoute = '/' }) => {
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

  if (!isMobile || isContactPage || !visible) return null

  return (
    <a
      href="https://studio24.bg"
      target="_blank"
      rel="noopener noreferrer"
      className="sticky-booking"
    >
      {t(translations.hero.bookBtn)}
    </a>
  )
}
