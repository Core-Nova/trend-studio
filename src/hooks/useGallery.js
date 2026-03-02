import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { imageData } from '../data/imageImports'

export const useGallery = () => {
  const { t } = useLanguage()

  return {
    sectionTag: t(translations.gallery.sectionTag),
    title: t(translations.gallery.title),
    instructions: t(translations.gallery.instructions),
    followText: t(translations.gallery.followText),
    seeAllBtn: t(translations.gallery.seeAllBtn),
    images: imageData.gallery,
    instagramUrl: 'https://instagram.com/trendbytedi',
    instagramHandle: '@trendbytedi'
  }
}
