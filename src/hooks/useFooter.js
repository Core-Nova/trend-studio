import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'

const CURRENT_YEAR = new Date().getFullYear()

export const useFooter = () => {
  const { t } = useLanguage()

  return {
    tagline: t(translations.footer.subtitle),
    copyright: t(translations.footer.copyright),
    year: CURRENT_YEAR
  }
}
