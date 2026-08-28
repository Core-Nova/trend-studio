import { useMemo } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { usePageSEO } from '../hooks/usePageSEO'
import { useBreadcrumbSchema } from '../hooks/useBreadcrumbSchema'
import { useContact } from '../hooks/useContact'
import { ContactView } from '../components/Contact/ContactView'

export const ContactPage = () => {
  const { t } = useLanguage()
  const contactData = useContact()

  usePageSEO({
    title: t(translations.seo.contactTitle),
    description: t(translations.seo.contactDescription)
  })

  const crumbs = useMemo(() => [
    { name: t(translations.nav.home), path: '/' },
    { name: t(translations.nav.contact), path: '/contact' },
  ], [t])
  useBreadcrumbSchema(crumbs)

  return (
    <div className="page-content">
      <ContactView {...contactData} as="h1" />
    </div>
  )
}

export default ContactPage
