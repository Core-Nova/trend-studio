import { useMemo } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { usePageSEO } from '../hooks/usePageSEO'
import { useBreadcrumbSchema } from '../hooks/useBreadcrumbSchema'
import { About } from '../components/About/About'
import { StudioPhotos } from '../components/StudioPhotos/StudioPhotos'
import { FAQ } from '../components/FAQ/FAQ'
import { Reviews } from '../components/Reviews/Reviews'
import { PATHS } from '../lib/routes'

export const AboutPage = () => {
  const { t } = useLanguage()

  usePageSEO({
    title: t(translations.seo.aboutTitle),
    description: t(translations.seo.aboutDescription)
  })

  const crumbs = useMemo(() => [
    { name: t(translations.nav.home), path: '/' },
    { name: t(translations.nav.about), path: PATHS.about },
  ], [t])
  useBreadcrumbSchema(crumbs)

  return (
    <div className="page-content">
      <About showProducts as="h1" title={t(translations.nav.about)} />
      <StudioPhotos />
      <FAQ />
      <Reviews />
    </div>
  )
}

export default AboutPage
