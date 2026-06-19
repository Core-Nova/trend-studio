import { useEffect, useRef } from 'react'
import { useSlider } from '../../hooks/useSlider'

export const StoriesViewer = ({
  images, currentIndex, progress, onClose, onNext, onPrev, onPause, onResume,
  instagramUrl, instagramHandle, phoneHref, callText
}) => {
  const viewerRef = useRef(null)
  const canvasRef = useRef(null)
  const isOpen = currentIndex !== null

  const { ready, controls } = useSlider({
    containerRef: canvasRef,
    images,
    autoPlay: false,
    enabled: isOpen
  })

  const handleNext = () => {
    if (controls.current) controls.current.next()
    onNext()
  }

  const handlePrev = () => {
    if (controls.current) controls.current.prev()
    onPrev()
  }

  useEffect(() => {
    if (currentIndex !== null && viewerRef.current) {
      viewerRef.current.focus()
    }
  }, [currentIndex])

  if (currentIndex === null) return null

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowLeft') handlePrev()
    else if (e.key === 'ArrowRight') handleNext()
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
      {!ready && (
        <img
          src={images[currentIndex]}
          alt={`TREND salon work ${currentIndex + 1}`}
          className="stories-viewer__image"
        />
      )}
      <div ref={canvasRef} className="stories-viewer__canvas" />
      <div
        className="stories-viewer__tap-zones"
        onTouchStart={onPause}
        onTouchEnd={onResume}
        onMouseDown={onPause}
        onMouseUp={onResume}
      >
        <div
          className="stories-viewer__tap-left"
          onClick={handlePrev}
          role="button"
          tabIndex={0}
          aria-label="Previous image"
          onKeyDown={(e) => e.key === 'Enter' && handlePrev()}
        />
        <div
          className="stories-viewer__tap-right"
          onClick={handleNext}
          role="button"
          tabIndex={0}
          aria-label="Next image"
          onKeyDown={(e) => e.key === 'Enter' && handleNext()}
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
          className="stories-viewer__cta-link stories-viewer__cta-ig"
        >
          <svg className="stories-viewer__ig-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
          {instagramHandle}
        </a>
      </div>
    </div>
  )
}
