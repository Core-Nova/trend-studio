import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { googleReviews } from '../data/reviews'
import { apiEnabled, fetchGoogleReviews } from '../lib/api'

export const useReviews = () => {
  const { t, lang } = useLanguage()
  const [live, setLive] = useState(null)

  useEffect(() => {
    let cancelled = false

    // Priority 1: live backend API
    if (apiEnabled) {
      fetchGoogleReviews().then(data => {
        if (!cancelled && data) setLive(data)
      })
      return () => { cancelled = true }
    }

    // Priority 2: static reviews.json (written by CI)
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
    googleUrl: data.profileUrl ?? googleReviews.profileUrl,
    rating: data.rating,
    totalCount: data.totalCount,
    reviews: data.reviews,
    isLive: Boolean(live),
    lang
  }
}
