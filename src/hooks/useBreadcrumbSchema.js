import { useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { localePath } from '../lib/routes'

const BASE_URL = 'https://trendbytedi.com'
const SCRIPT_ID = 'breadcrumb-schema'

/**
 * Injects a BreadcrumbList JSON-LD script into <head> for non-home routes.
 * Items: [{ name, path }] with paths from PATHS — they are moved into the
 * current language's URL space here. Removes on unmount or path change.
 */
export const useBreadcrumbSchema = items => {
  const { lang } = useLanguage()

  useEffect(() => {
    if (!items || items.length === 0) return undefined

    const data = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: `${BASE_URL}${localePath(item.path, lang)}`,
      })),
    }

    let script = document.getElementById(SCRIPT_ID)
    if (!script) {
      script = document.createElement('script')
      script.id = SCRIPT_ID
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(data)

    return () => {
      const existing = document.getElementById(SCRIPT_ID)
      if (existing) existing.remove()
    }
  }, [items, lang])
}
