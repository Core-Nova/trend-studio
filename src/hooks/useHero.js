import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { useHeroSliders } from './useHeroSliders'

export const useHero = () => {
  const { t } = useLanguage()
  const { leftRef, rightRef, isMobile } = useHeroSliders()

  return {
    subtitle: t(translations.hero.subtitle),
    tagline: t(translations.hero.tagline),
    bookBtn: t(translations.hero.bookBtn),
    isMobile,
    leftRef,
    rightRef
  }
}
