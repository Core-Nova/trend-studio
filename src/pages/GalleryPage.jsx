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
          >
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
