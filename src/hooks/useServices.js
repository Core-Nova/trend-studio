import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import servicesData from '../data/services.json'

const SERVICE_ICONS = ['\u2702', '\u2726', '\u2727', '\u2726']
const PREVIEW_LIMIT = 4

export const useServices = ({ withPricing = false } = {}) => {
  const { t } = useLanguage()

  const categories = servicesData.services.categories.map((category, i) => {
    const base = {
      id: category.id,
      icon: SERVICE_ICONS[i] || '\u2726',
      name: t(category.name),
      count: category.items.length,
      description: t(translations.services.descriptions[i]),
      preview: category.items.slice(0, PREVIEW_LIMIT).map(item => t(item.name)),
      hasMore: category.items.length > PREVIEW_LIMIT
    }

    if (!withPricing) return base

    return {
      ...base,
      items: category.items.map(item => ({
        name: t(item.name),
        duration: t(item.duration),
        priceEur: item.price_eur,
        note: item.price_note ? t(item.price_note) : null,
        options: item.options ? item.options.map(opt => ({
          name: t(opt.name),
          duration: opt.duration,
          eur: opt.eur
        })) : null
      }))
    }
  })

  return {
    sectionTag: t(translations.services.sectionTag),
    title: t(translations.services.title),
    seeAllBtn: t(translations.services.seeAllBtn),
    note: withPricing ? t(servicesData.price_note) : null,
    ctaText: withPricing ? t(translations.prices.ctaText) : null,
    ctaUrl: withPricing ? 'https://studio24.bg/hair-boutique-studio-trend-s4258' : null,
    categories
  }
}
