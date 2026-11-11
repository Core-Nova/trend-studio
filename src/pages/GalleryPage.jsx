import { useMemo } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { usePageSEO } from '../hooks/usePageSEO'
import { useBreadcrumbSchema } from '../hooks/useBreadcrumbSchema'
import { InstagramFeed } from '../components/InstagramFeed/InstagramFeed'
import { PATHS } from '../lib/routes'

/**
 * The gallery IS the salon's Instagram feed (InstagramFeed), falling back to
 * the bundled photos until the feed is connected. The home page's Gallery
 * section still shows the bundled photos with the stories viewer / lightbox.
 */
export const GalleryPage = () => {
  const { t } = useLanguage()

  usePageSEO({
    title: t(translations.seo.galleryTitle),
    description: t(translations.seo.galleryDescription)
  })

  const crumbs = useMemo(() => [
    { name: t(translations.nav.home), path: '/' },
    { name: t(translations.nav.gallery), path: PATHS.gallery },
  ], [t])
  useBreadcrumbSchema(crumbs)

  return (
    <div className="page-content">
      <InstagramFeed
        tag={t(translations.gallery.sectionTag)}
        title={t(translations.gallery.title)}
        as="h1"
        location="gallery_page"
      />
    </div>
  )
}

export default GalleryPage
