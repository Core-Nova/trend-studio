import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

export const GalleryView = ({
  sectionTag, title, instructions, followText, images, instagramUrl, instagramHandle,
  showSeeAll, seeAllBtn, isMobile
}) => {
  const containerRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]
  const disposeRef = useRef(null)

  useEffect(() => {
    if (isMobile || typeof THREE === 'undefined') return

    let mounted = true

    import('../../lib/slider.js').then(({ createGallerySliders }) => {
      if (!mounted) return
      const containers = containerRefs.map(r => r.current).filter(Boolean)
      if (!containers.length || !images.length) return

      disposeRef.current = createGallerySliders({
        containers,
        images,
        staggerDelay: 200
      })
    })

    return () => {
      mounted = false
      if (disposeRef.current) disposeRef.current()
      disposeRef.current = null
    }
  }, [isMobile, images])

  return (
    <section id="gallery" className="gallery-section">
      <div className="gallery-header">
        <span className="section-tag">{sectionTag}</span>
        <h2 className="section-title">{title}</h2>
        <div className="ornament"></div>
      </div>
      {!isMobile && <p className="slider-instructions">{instructions}</p>}
      {!isMobile && (
        <div className="gallery-sliders-container">
          {containerRefs.map((ref, i) => (
            <div key={i} className="gallery-slider-item">
              <div ref={ref} className="gallery-three-container"></div>
            </div>
          ))}
        </div>
      )}
      {isMobile && images.length > 0 && (
        <div className="gallery-carousel">
          {images.map((url, i) => (
            <div key={i} className="gallery-carousel-item">
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
    </section>
  )
}
