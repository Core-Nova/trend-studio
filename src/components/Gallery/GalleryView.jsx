import { Link } from 'react-router-dom'
import { SectionHeader } from '../atoms/SectionHeader'
import { StoriesHighlights } from '../Stories/StoriesHighlights'
import { StoriesViewer } from '../Stories/StoriesViewer'

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
      <img
        src={images[index].src}
        alt={`TREND salon work ${index + 1}`}
        className="lightbox__img"
        onClick={(e) => e.stopPropagation()}
      />
      <button className="lightbox__next" onClick={(e) => { e.stopPropagation(); onNext() }} aria-label="Next image">&rsaquo;</button>
    </div>
  )
}

export const GalleryView = ({
  sectionTag, title, followText, instagramUrl, instagramHandle,
  showSeeAll, seeAllBtn, isMobile, stories, lightbox, allImages, allImageUrls, storyGroups
}) => (
  <section id="gallery" className="gallery-section">
    <div className="gallery-header">
      <SectionHeader tag={sectionTag} title={title} />
    </div>
    {!isMobile && (
      <div className="gallery-masonry">
        {allImages.map((img, i) => (
          <div
            key={i}
            className="gallery-masonry__item"
            style={{ aspectRatio: `${img.width} / ${img.height}` }}
            onClick={() => lightbox.open(i)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && lightbox.open(i)}
          >
            <img
              src={img.src}
              alt={`TREND salon work ${i + 1}`}
              width={img.width}
              height={img.height}
              loading={i < 6 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>
    )}
    {isMobile && (
      <StoriesHighlights groups={storyGroups} onOpen={stories.open} />
    )}
    <div className="gallery-instagram">
      <p>{followText}</p>
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
