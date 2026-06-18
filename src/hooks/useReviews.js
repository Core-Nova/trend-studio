import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { googleReviews } from '../data/reviews'
import { apiEnabled, fetchGoogleReviews } from '../lib/api'

export const useReviews = () => {
  const { t, lang } = useLanguage()
  const [live, setLive] = useState(null)

  useEffect(() => {
    if (!apiEnabled) return
    let cancelled = false
    fetchGoogleReviews().then(data => {
      if (!cancelled && data) setLive(data)
    })
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
