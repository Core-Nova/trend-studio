import { useEffect } from 'react'

export const usePageSEO = ({ title, description }) => {
  useEffect(() => {
    if (title) document.title = title

    if (description) {
      const metas = [
        ['meta[name="description"]', 'content'],
        ['meta[property="og:description"]', 'content'],
        ['meta[name="twitter:description"]', 'content'],
      ]
      metas.forEach(([selector, attr]) => {
        const el = document.querySelector(selector)
        if (el) el.setAttribute(attr, description)
      })
    }

    if (title) {
      const titleMetas = [
        ['meta[property="og:title"]', 'content'],
        ['meta[name="twitter:title"]', 'content'],
      ]
      titleMetas.forEach(([selector, attr]) => {
        const el = document.querySelector(selector)
        if (el) el.setAttribute(attr, title)
      })
    }
  }, [title, description])
}
