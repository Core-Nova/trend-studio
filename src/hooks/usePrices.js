import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import servicesData from '../data/services.json'

export const usePrices = () => {
  const { t } = useLanguage()

  const categories = servicesData.services.categories.map(category => ({
    id: category.id,
    name: t(category.name),
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
  }))

  return {
    sectionTag: t(translations.prices.sectionTag),
    title: t(translations.prices.title),
    note: t(servicesData.price_note),
    ctaText: t(translations.prices.ctaText),
    ctaUrl: 'https://studio24.bg/hair-boutique-studio-trend-s4258',
    categories
  }
}
