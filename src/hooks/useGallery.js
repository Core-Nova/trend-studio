import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'

export const useGallery = () => {
  const { t } = useLanguage()

  return {
    sectionTag: t(translations.gallery.sectionTag),
    title: t(translations.gallery.title),
    followText: t(translations.gallery.followText),
    seeAllBtn: t(translations.gallery.seeAllBtn),
    instagramUrl: 'https://instagram.com/trendbytedi',
    instagramHandle: '@trendbytedi'
  }
}
