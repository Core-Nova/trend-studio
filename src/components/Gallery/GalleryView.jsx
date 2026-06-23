import { Link } from 'react-router-dom'
import { SectionHeader } from '../atoms/SectionHeader'
import { ResponsiveImage } from '../atoms/ResponsiveImage'
import { StoriesHighlights } from '../Stories/StoriesHighlights'
import { StoriesViewer } from '../Stories/StoriesViewer'
import { useScrollReveal } from '../../hooks/useScrollReveal'

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
      <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="instagram-link">
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
