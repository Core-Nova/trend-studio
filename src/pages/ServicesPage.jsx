import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { usePageSEO } from '../hooks/usePageSEO'
import { useServices } from '../hooks/useServices'
import { usePrices } from '../hooks/usePrices'
import { ServicesView } from '../components/Services/ServicesView'
import { PricesView } from '../components/Prices/PricesView'

export const ServicesPage = () => {
  const { t } = useLanguage()
  const servicesData = useServices()
  const pricesData = usePrices()

  usePageSEO({
    title: t(translations.seo.servicesTitle),
    description: t(translations.seo.servicesDescription)
  })

  return (
    <div className="page-content">
      <ServicesView {...servicesData} />
      <PricesView {...pricesData} />
    </div>
  )
}

export default ServicesPage
