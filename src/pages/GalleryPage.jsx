import { SectionHeader } from '../components/atoms/SectionHeader'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { usePageSEO } from '../hooks/usePageSEO'
import { useIsMobile } from '../hooks/useIsMobile'
import { useStories } from '../hooks/useStories'
import { useLightbox } from '../hooks/useLightbox'
import { allImages, STORY_GROUPS } from '../data/imageImports'
import { StoriesHighlights } from '../components/Stories/StoriesHighlights'
import { StoriesViewer } from '../components/Stories/StoriesViewer'

export const GalleryPage = () => {
  const { t } = useLanguage()
  const isMobile = useIsMobile()
  const stories = useStories({ images: allImages, duration: 5000 })
  const { lightboxIndex, lightboxRef, open: openLightbox, close: closeLightbox, prev: prevImage, next: nextImage } = useLightbox(allImages.length)

  usePageSEO({
    title: t(translations.seo.galleryTitle),
    description: t(translations.seo.galleryDescription)
  })

  return (
    <div className="page-content">
      <div className="gallery-section gallery-section--page">
        <div className="gallery-header">
          <SectionHeader tag={t(translations.gallery.sectionTag)} title={t(translations.gallery.title)} />
        </div>
        {isMobile && (
          <StoriesHighlights groups={STORY_GROUPS} onOpen={stories.open} />
        )}
        <div className="page-gallery-grid">
          {allImages.map((url, i) => (
            <div
              key={i}
              className="page-gallery-grid__item"
              onClick={() => isMobile ? stories.open(i) : openLightbox(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && (isMobile ? stories.open(i) : openLightbox(i))}
            >
              <img
                src={url}
                alt={`TREND salon work ${i + 1}`}
                loading="lazy"
                width="600"
                height="800"
              />
            </div>
          ))}
        </div>
        <div className="gallery-instagram gallery-instagram--page">
          <p>{t(translations.gallery.followText)}</p>
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
          <img
            src={allImages[lightboxIndex]}
            alt={`TREND salon work ${lightboxIndex + 1}`}
            className="lightbox__img"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="lightbox__next" onClick={(e) => { e.stopPropagation(); nextImage() }} aria-label="Next image">&rsaquo;</button>
        </div>
      )}
      <StoriesViewer
        images={allImages}
        currentIndex={stories.currentIndex}
        progress={stories.progress}
        onClose={stories.close}
        onNext={stories.next}
        onPrev={stories.prev}
        onPause={stories.pause}
        onResume={stories.resume}
        instagramUrl="https://instagram.com/trendbytedi"
        instagramHandle="@trendbytedi"
      />
    </div>
  )
}

export default GalleryPage
