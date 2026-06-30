import { useMemo } from 'react'
import { SectionHeader } from '../components/atoms/SectionHeader'
import { ResponsiveImage } from '../components/atoms/ResponsiveImage'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { usePageSEO } from '../hooks/usePageSEO'
import { useBreadcrumbSchema } from '../hooks/useBreadcrumbSchema'
import { useIsMobile } from '../hooks/useIsMobile'
import { useStories } from '../hooks/useStories'
import { useLightbox } from '../hooks/useLightbox'
import { useGalleryImages } from '../hooks/useGalleryImages'
import { StoriesHighlights } from '../components/Stories/StoriesHighlights'
import { StoriesViewer } from '../components/Stories/StoriesViewer'
import { trackEvent } from '../lib/analytics'

export const GalleryPage = () => {
  const { t } = useLanguage()
  const isMobile = useIsMobile()
  const { images, imageUrls, storyGroups, isLive } = useGalleryImages(12)
  const stories = useStories({ images: imageUrls, duration: 5000 })
  const { lightboxIndex, lightboxRef, open: openLightbox, close: closeLightbox, prev: prevImage, next: nextImage } = useLightbox(images.length)

  usePageSEO({
    title: t(translations.seo.galleryTitle),
    description: t(translations.seo.galleryDescription)
  })

  const crumbs = useMemo(() => [
    { name: t(translations.nav.home), path: '/' },
    { name: t(translations.nav.gallery), path: '/gallery' },
  ], [t])
  useBreadcrumbSchema(crumbs)

  return (
    <div className="page-content">
      <div className="gallery-section gallery-section--page">
        <div className="gallery-header">
          <SectionHeader tag={t(translations.gallery.sectionTag)} title={t(translations.gallery.title)} />
        </div>
        {isMobile && (
          <StoriesHighlights groups={storyGroups} onOpen={stories.open} />
        )}
        <div className="page-gallery-grid">
          {images.map((img, i) => (
            <div
              key={i}
              className="page-gallery-grid__item"
              onClick={() => isMobile ? stories.open(i) : openLightbox(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && (isMobile ? stories.open(i) : openLightbox(i))}
            >
              <ResponsiveImage
                src={img.src}
                srcSetWebp={img.srcSetWebp}
                srcSetAvif={img.srcSetAvif}
                sizes="(max-width: 768px) 50vw, 33vw"
                alt={img.alt || `TREND salon work ${i + 1}`}
                loading={i < 6 ? 'eager' : 'lazy'}
                decoding="async"
                width={img.width}
                height={img.height}
              />
            </div>
          ))}
        </div>
        <div className="gallery-instagram gallery-instagram--page">
          <p>
            {isLive && <span className="live-badge">Live</span>}
            {t(translations.gallery.followText)}
          </p>
          <a
            href="https://instagram.com/trendbytedi"
            target="_blank"
            rel="noopener noreferrer"
            className="instagram-link"
            aria-label="Follow @trendbytedi on Instagram"
            onClick={() => trackEvent('share', { method: 'instagram', location: 'gallery_page' })}
          >
            <svg className="instagram-link__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            @trendbytedi
          </a>
        </div>
      </div>
      {!isMobile && lightboxIndex !== null && (
        <div
          ref={lightboxRef}
          className="lightbox"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeLightbox()
            else if (e.key === 'ArrowLeft') prevImage()
            else if (e.key === 'ArrowRight') nextImage()
          }}
        >
          <button className="lightbox__close" onClick={closeLightbox} aria-label="Close lightbox">&times;</button>
          <button className="lightbox__prev" onClick={(e) => { e.stopPropagation(); prevImage() }} aria-label="Previous image">&lsaquo;</button>
          <ResponsiveImage
            src={images[lightboxIndex].src}
            srcSetWebp={images[lightboxIndex].srcSetWebp}
            srcSetAvif={images[lightboxIndex].srcSetAvif}
            sizes="100vw"
            alt={images[lightboxIndex].alt || `TREND salon work ${lightboxIndex + 1}`}
            className="lightbox__img"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="lightbox__next" onClick={(e) => { e.stopPropagation(); nextImage() }} aria-label="Next image">&rsaquo;</button>
        </div>
      )}
      <StoriesViewer
        images={imageUrls}
        currentIndex={stories.currentIndex}
        progress={stories.progress}
        onClose={stories.close}
        onNext={stories.next}
        onPrev={stories.prev}
        onPause={stories.pause}
        onResume={stories.resume}
        instagramUrl="https://instagram.com/trendbytedi"
        instagramHandle="trendbytedi"
      />
    </div>
  )
}

export default GalleryPage
