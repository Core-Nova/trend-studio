import { useMemo } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { usePageSEO } from '../hooks/usePageSEO'
import { useBreadcrumbSchema } from '../hooks/useBreadcrumbSchema'
import { useServices } from '../hooks/useServices'
import { ServicesView } from '../components/Services/ServicesView'

export const ServicesPage = () => {
  const { t } = useLanguage()
  const servicesData = useServices({ withPricing: true })

  usePageSEO({
    title: t(translations.seo.servicesTitle),
    description: t(translations.seo.servicesDescription)
  })

  const crumbs = useMemo(() => [
    { name: t(translations.nav.home), path: '/' },
    { name: t(translations.nav.services), path: '/services' },
  ], [t])
  useBreadcrumbSchema(crumbs)

  return (
    <div className="page-content">
      <ServicesView {...servicesData} />
    </div>
  )
}

export default ServicesPage
