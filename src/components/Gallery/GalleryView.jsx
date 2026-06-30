import { Link } from 'react-router-dom'
import { SectionHeader } from '../atoms/SectionHeader'
import { ResponsiveImage } from '../atoms/ResponsiveImage'
import { StoriesHighlights } from '../Stories/StoriesHighlights'
import { StoriesViewer } from '../Stories/StoriesViewer'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { trackEvent } from '../../lib/analytics'

const Lightbox = ({ images, index, onClose, onPrev, onNext, lightboxRef }) => {
  if (index === null) return null

  return (
    <div
      ref={lightboxRef}
      className="lightbox"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
        else if (e.key === 'ArrowLeft') onPrev()
        else if (e.key === 'ArrowRight') onNext()
      }}
    >
      <button className="lightbox__close" onClick={onClose} aria-label="Close lightbox">&times;</button>
      <button className="lightbox__prev" onClick={(e) => { e.stopPropagation(); onPrev() }} aria-label="Previous image">&lsaquo;</button>
      <ResponsiveImage
        src={images[index].src}
        srcSetWebp={images[index].srcSetWebp}
        srcSetAvif={images[index].srcSetAvif}
        sizes="100vw"
        alt={images[index].alt || `TREND salon work ${index + 1}`}
        className="lightbox__img"
        onClick={(e) => e.stopPropagation()}
      />
      <button className="lightbox__next" onClick={(e) => { e.stopPropagation(); onNext() }} aria-label="Next image">&rsaquo;</button>
    </div>
  )
}

const VISIBLE = 6

export const GalleryView = ({
  sectionTag, title, followText, instagramUrl, instagramHandle,
  showSeeAll, seeAllBtn, isMobile, isLive, stories, lightbox, carousel, allImages, allImageUrls, storyGroups
}) => {
  const { ref, revealed } = useScrollReveal()
  return (
  <section id="gallery" className={`gallery-section scroll-reveal ${revealed ? 'scroll-reveal--visible' : ''}`} ref={ref}>
    <div className="gallery-header">
      <SectionHeader tag={sectionTag} title={title} />
    </div>
    {!isMobile && (
      <>
        <div
          className="gallery-carousel-wrap"
          onMouseEnter={carousel.pause}
          onMouseLeave={carousel.resume}
        >
          <button
            className="gallery-carousel__arrow gallery-carousel__arrow--prev"
            onClick={carousel.prev}
            aria-label="Previous images"
          >
            &#8249;
          </button>
          <div className="gallery-carousel__viewport">
            <div
              className="gallery-carousel__track"
              style={{ transform: `translateX(-${carousel.currentIndex * (100 / VISIBLE)}%)` }}
            >
              {allImages.map((img, i) => (
                <div
                  key={i}
                  className="gallery-carousel__slide"
                  onClick={() => lightbox.open(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && lightbox.open(i)}
                >
                  <ResponsiveImage
                    src={img.src}
                    srcSetWebp={img.srcSetWebp}
                    srcSetAvif={img.srcSetAvif}
                    sizes="(max-width: 768px) 50vw, 25vw"
                    alt={img.alt || `TREND salon work ${i + 1}`}
                    width={img.width}
                    height={img.height}
                    loading={i < 6 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                </div>
              ))}
            </div>
          </div>
          <button
            className="gallery-carousel__arrow gallery-carousel__arrow--next"
            onClick={carousel.next}
            aria-label="Next images"
          >
            &#8250;
          </button>
        </div>
        <div className="gallery-carousel__dots">
          {allImages.map((_, i) => (
            <button
              key={i}
              className={`gallery-carousel__dot ${i === carousel.currentIndex ? 'gallery-carousel__dot--active' : ''}`}
              onClick={() => carousel.goTo(i)}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      </>
    )}
    {isMobile && (
      <StoriesHighlights groups={storyGroups} onOpen={stories.open} />
    )}
    <div className="gallery-instagram">
      <p>
        {isLive && <span className="live-badge">Live</span>}
        {followText}
      </p>
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="instagram-link"
        aria-label={`Follow ${instagramHandle} on Instagram`}
        onClick={() => trackEvent('share', { method: 'instagram', location: 'gallery_section' })}
      >
        <svg className="instagram-link__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
        {instagramHandle}
      </a>
    </div>
    {showSeeAll && (
      <div className="section-see-all">
        <Link to="/gallery" className="btn btn-secondary">{seeAllBtn}</Link>
      </div>
    )}
    {!isMobile && (
      <Lightbox
        images={allImages}
        index={lightbox.lightboxIndex}
        onClose={lightbox.close}
        onPrev={lightbox.prev}
        onNext={lightbox.next}
        lightboxRef={lightbox.lightboxRef}
      />
    )}
    {isMobile && (
      <StoriesViewer
        images={allImageUrls}
        currentIndex={stories.currentIndex}
        progress={stories.progress}
        onClose={stories.close}
        onNext={stories.next}
        onPrev={stories.prev}
        onPause={stories.pause}
        onResume={stories.resume}
        instagramUrl={instagramUrl}
        instagramHandle={instagramHandle}
      />
    )}
  </section>
  )
}
