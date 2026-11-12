import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { DEFAULT_LANG, LANGS, localePath } from '../lib/routes'

const BASE_URL = 'https://trendbytedi.com'

const OG_LOCALE = { en: 'en_US', bg: 'bg_BG' }
const OG_LOCALE_ALT = { en: 'bg_BG', bg: 'en_US' }

const setHreflang = (code, href) => {
  let link = document.querySelector(`link[rel="alternate"][hreflang="${code}"]`)
  if (!link) {
    link = document.createElement('link')
    link.rel = 'alternate'
    link.hreflang = code
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

/**
 * Keeps <head> in step with the current page and language. The values must
 * equal what scripts/seo-routes.mjs prerenders for the same URL (self
 * canonical, og:url, og:locale, reciprocal hreflang with x-default → the
 * Bulgarian URL) — Google reads both the static HTML and the rendered DOM.
 */
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
    // The pathname already carries the language ("/en/gallery/"), so the
    // canonical is always the page's own URL in its own language.
    const path = location.pathname.replace(/\/?$/, '/')
    const pageUrl = `${BASE_URL}${path}`
    const ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl) ogUrl.setAttribute('content', pageUrl)

    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) canonical.setAttribute('href', pageUrl)

    LANGS.forEach(code => setHreflang(code, `${BASE_URL}${localePath(path, code)}`))
    setHreflang('x-default', `${BASE_URL}${localePath(path, DEFAULT_LANG)}`)

    const ogLocale = document.querySelector('meta[property="og:locale"]')
    if (ogLocale && OG_LOCALE[lang]) ogLocale.setAttribute('content', OG_LOCALE[lang])
    const ogLocaleAlt = document.querySelector('meta[property="og:locale:alternate"]')
    if (ogLocaleAlt && OG_LOCALE_ALT[lang]) ogLocaleAlt.setAttribute('content', OG_LOCALE_ALT[lang])
  }, [title, description, location.pathname, lang])
}
