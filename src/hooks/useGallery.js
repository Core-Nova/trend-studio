import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { SITE } from '../lib/constants'

export const useGallery = () => {
  const { t } = useLanguage()

  return {
    sectionTag: t(translations.gallery.sectionTag),
    title: t(translations.gallery.title),
    followText: t(translations.gallery.followText),
    seeAllBtn: t(translations.gallery.seeAllBtn),
    instagramUrl: SITE.instagramUrl,
    instagramHandle: SITE.instagramHandle
  }
}
