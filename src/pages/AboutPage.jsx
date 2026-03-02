import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { usePageSEO } from '../hooks/usePageSEO'
import { About } from '../components/About/About'
import { Reviews } from '../components/Reviews/Reviews'

export const AboutPage = () => {
  const { t } = useLanguage()

  usePageSEO({
    title: t(translations.seo.aboutTitle),
    description: t(translations.seo.aboutDescription)
  })

  return (
    <div className="page-content">
      <About />
      <Reviews />
    </div>
  )
}

export default AboutPage
