import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import servicesData from '../data/services.json'

const SERVICE_ICONS = ['\u2702', '\u{1F3A8}', '\u{1F4AB}', '\u{2728}']

export const useServices = () => {
  const { t } = useLanguage()

  const categories = servicesData.services.categories.map((category, i) => ({
    id: category.id,
    icon: SERVICE_ICONS[i] || '\u2726',
    name: t(category.name),
    count: category.items.length,
    description: t(translations.services.descriptions[i])
  }))

  return {
    sectionTag: t(translations.services.sectionTag),
    title: t(translations.services.title),
    seeAllBtn: t(translations.services.seeAllBtn),
    categories
  }
}
