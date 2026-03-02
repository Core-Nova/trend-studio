import { useEffect, useRef } from 'react'

export const StoriesViewer = ({
  images, currentIndex, progress, onClose, onNext, onPrev, onPause, onResume,
  instagramUrl, instagramHandle, phoneHref, callText
}) => {
  const viewerRef = useRef(null)

  useEffect(() => {
    if (currentIndex !== null && viewerRef.current) {
      viewerRef.current.focus()
    }
  }, [currentIndex])

  if (currentIndex === null) return null

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowLeft') onPrev()
    else if (e.key === 'ArrowRight') onNext()
  }

  return (
    <div
      ref={viewerRef}
      className="stories-viewer"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <div className="stories-progress">
        {images.map((_, i) => (
          <div key={i} className="stories-progress__segment">
            <div
              className="stories-progress__bar"
              style={{
                width: i < currentIndex ? '100%' : i === currentIndex ? `${progress * 100}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>
      <button className="stories-viewer__close" onClick={onClose} aria-label="Close">&times;</button>
      <img
        src={images[currentIndex]}
        alt={`TREND salon work ${currentIndex + 1}`}
        className="stories-viewer__image"
      />
      <div
        className="stories-viewer__tap-zones"
        onTouchStart={onPause}
        onTouchEnd={onResume}
        onMouseDown={onPause}
        onMouseUp={onResume}
      >
        <div
          className="stories-viewer__tap-left"
          onClick={onPrev}
          role="button"
          tabIndex={0}
          aria-label="Previous image"
          onKeyDown={(e) => e.key === 'Enter' && onPrev()}
        />
        <div
          className="stories-viewer__tap-right"
          onClick={onNext}
          role="button"
          tabIndex={0}
          aria-label="Next image"
          onKeyDown={(e) => e.key === 'Enter' && onNext()}
        />
      </div>
      <div className="stories-viewer__cta">
        {phoneHref && (
          <a href={phoneHref} className="stories-viewer__cta-link stories-viewer__cta-call">
            &#9742; {callText}
          </a>
        )}
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="stories-viewer__cta-link"
        >
          {instagramHandle}
        </a>
      </div>
    </div>
  )
}
