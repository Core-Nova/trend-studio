import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { googleReviews } from '../data/reviews'

export const useReviews = () => {
  const { t, lang } = useLanguage()

  return {
    sectionTag: t(translations.reviews.sectionTag),
    title: t(translations.reviews.title),
    googleBtn: t(translations.reviews.googleBtn),
    note: t(translations.reviews.note),
    googleUrl: googleReviews.profileUrl,
    rating: googleReviews.rating,
    totalCount: googleReviews.totalCount,
    reviews: googleReviews.reviews,
    lang
  }
}
