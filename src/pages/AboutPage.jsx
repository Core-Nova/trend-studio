import { useMemo } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { usePageSEO } from '../hooks/usePageSEO'
import { useBreadcrumbSchema } from '../hooks/useBreadcrumbSchema'
import { About } from '../components/About/About'
import { FAQ } from '../components/FAQ/FAQ'
import { Reviews } from '../components/Reviews/Reviews'

export const AboutPage = () => {
  const { t } = useLanguage()

  usePageSEO({
    title: t(translations.seo.aboutTitle),
    description: t(translations.seo.aboutDescription)
  })

  const crumbs = useMemo(() => [
    { name: t(translations.nav.home), path: '/' },
    { name: t(translations.nav.about), path: '/about' },
  ], [t])
  useBreadcrumbSchema(crumbs)

  return (
    <div className="page-content">
      <About showProducts />
      <FAQ />
      <Reviews />
    </div>
  )
}

export default AboutPage
