import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const BASE_URL = 'https://trendsalon.bg/trend-studio'

export const usePageSEO = ({ title, description }) => {
  const location = useLocation()

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

    const pageUrl = `${BASE_URL}${location.pathname}`
    const ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl) ogUrl.setAttribute('content', pageUrl)

    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) canonical.setAttribute('href', pageUrl)
  }, [title, description, location.pathname])
}
