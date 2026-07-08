import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { brandLogos } from '../data/brandLogos'

export const useAbout = () => {
  const { t } = useLanguage()

  return {
    sectionTag: t(translations.about.sectionTag),
    paragraph1: t(translations.about.paragraph1),
    paragraph2: t(translations.about.paragraph2),
    feature1: t(translations.about.feature1),
    feature2: t(translations.about.feature2),
    feature3: t(translations.about.feature3),
    productsTitle: t(translations.about.productsTitle),
    products: translations.about.products.map(p => ({ name: p.name, desc: t(p.desc), logo: brandLogos[p.name] })),
    seeAllBtn: t(translations.about.seeAllBtn)
  }
}
