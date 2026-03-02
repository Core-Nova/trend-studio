import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'

export const useAbout = () => {
  const { t } = useLanguage()

  return {
    sectionTag: t(translations.about.sectionTag),
    paragraph1: t(translations.about.paragraph1),
    paragraph2: t(translations.about.paragraph2),
    feature1: t(translations.about.feature1),
    feature2: t(translations.about.feature2),
    feature3: t(translations.about.feature3),
    seeAllBtn: t(translations.about.seeAllBtn)
  }
}
