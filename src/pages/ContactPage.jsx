import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { usePageSEO } from '../hooks/usePageSEO'
import { useContact } from '../hooks/useContact'
import { ContactView } from '../components/Contact/ContactView'

export const ContactPage = () => {
  const { t } = useLanguage()
  const contactData = useContact()

  usePageSEO({
    title: t(translations.seo.contactTitle),
    description: t(translations.seo.contactDescription)
  })

  return (
    <div className="page-content">
      <ContactView {...contactData} />
    </div>
  )
}
