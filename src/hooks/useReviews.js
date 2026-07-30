import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { googleReviews } from '../data/reviews'
import { SITE } from '../lib/constants'

export const useReviews = () => {
  const { t, lang } = useLanguage()
  const [live, setLive] = useState(null)

  useEffect(() => {
    let cancelled = false

    // Fresh Google reviews scraped into public/reviews.json by the
    // "Update Google Reviews" GitHub Action; the bundled src/data/reviews.js
    // snapshot is the fallback when the scraped file isn't present.
    fetch(`${import.meta.env.BASE_URL}reviews.json`)
      .then(r => {
        if (!r.ok) throw new Error(r.status)
        return r.json()
      })
      .then(data => {
        if (!cancelled && data?.reviews?.length) setLive(data)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [])

  const data = live ?? googleReviews

  return {
    sectionTag: t(translations.reviews.sectionTag),
    title: t(translations.reviews.title),
    googleBtn: t(translations.reviews.googleBtn),
    note: t(translations.reviews.note),
    // The salon's canonical Maps listing (same as Contact/Footer) — not the
    // scraped profileUrl, whose guessed coordinates point to the wrong place.
    googleUrl: SITE.mapsUrl,
    rating: data.rating,
    totalCount: data.totalCount,
    reviews: data.reviews,
    lang
  }
}
