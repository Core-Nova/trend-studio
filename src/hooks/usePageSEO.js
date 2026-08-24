import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'

const BASE_URL = 'https://trendbytedi.com'

const OG_LOCALE = { en: 'en_US', bg: 'bg_BG' }
const OG_LOCALE_ALT = { en: 'bg_BG', bg: 'en_US' }

export const usePageSEO = ({ title, description }) => {
  const location = useLocation()
  const { lang } = useLanguage()

  useEffect(() => {
    if (title) {
      document.title = title
      const titleMetas = [
        'meta[property="og:title"]',
        'meta[name="twitter:title"]',
      ]
      titleMetas.forEach(selector => {
        const el = document.querySelector(selector)
        if (el) el.setAttribute('content', title)
      })
    }

    if (description) {
      const descMetas = [
        'meta[name="description"]',
        'meta[property="og:description"]',
        'meta[name="twitter:description"]',
      ]
      descMetas.forEach(selector => {
        const el = document.querySelector(selector)
        if (el) el.setAttribute('content', description)
      })
    }

    // Trailing slash: GitHub Pages serves each route's directory index at
    // "/gallery/" and 301s "/gallery" to it, so the canonical must carry the
    // slash — otherwise it points at a URL that redirects back to this page.
    const pageUrl = `${BASE_URL}${location.pathname.replace(/\/?$/, '/')}`
    const ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl) ogUrl.setAttribute('content', pageUrl)

    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) canonical.setAttribute('href', pageUrl)

    const ogLocale = document.querySelector('meta[property="og:locale"]')
    if (ogLocale && OG_LOCALE[lang]) ogLocale.setAttribute('content', OG_LOCALE[lang])
    const ogLocaleAlt = document.querySelector('meta[property="og:locale:alternate"]')
    if (ogLocaleAlt && OG_LOCALE_ALT[lang]) ogLocaleAlt.setAttribute('content', OG_LOCALE_ALT[lang])
  }, [title, description, location.pathname, lang])
}
