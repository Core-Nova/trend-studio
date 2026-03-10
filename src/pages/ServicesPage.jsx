import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { usePageSEO } from '../hooks/usePageSEO'
import { useServices } from '../hooks/useServices'
import { ServicesView } from '../components/Services/ServicesView'

export const ServicesPage = () => {
  const { t } = useLanguage()
  const servicesData = useServices({ withPricing: true })

  usePageSEO({
    title: t(translations.seo.servicesTitle),
    description: t(translations.seo.servicesDescription)
  })

  return (
    <div className="page-content">
      <ServicesView {...servicesData} />
    </div>
  )
}

export default ServicesPage
