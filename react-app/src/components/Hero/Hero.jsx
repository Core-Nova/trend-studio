import { useRef, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../translations'
import { useIsMobile } from '../../hooks/useIsMobile'
import { ImageCrossfade } from '../ImageCrossfade/ImageCrossfade'
import { imageData } from '../../data/imageImports'

const mobileImages = [...imageData.hero_left, ...imageData.hero_right]

export const Hero = () => {
  const { t } = useLanguage()
  const isMobile = useIsMobile()
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const disposersRef = useRef([])

  useEffect(() => {
    if (isMobile || typeof THREE === 'undefined' || typeof TweenMax === 'undefined') return

    let mounted = true

    import('../../lib/slider.js').then(({ createImageSlider }) => {
      if (!mounted) return

      if (leftRef.current && imageData.hero_left.length) {
        const d = createImageSlider({
          container: leftRef.current,
          images: imageData.hero_left,
          width: 70,
          height: 105
        })
        if (d) disposersRef.current.push(d)
      }

      setTimeout(() => {
        if (!mounted) return
        if (rightRef.current && imageData.hero_right.length) {
          const d = createImageSlider({
            container: rightRef.current,
            images: imageData.hero_right,
            width: 70,
            height: 105
          })
          if (d) disposersRef.current.push(d)
        }
      }, 500)
    })

    return () => {
      mounted = false
      disposersRef.current.forEach(d => d())
      disposersRef.current = []
    }
  }, [isMobile])

  return (
    <section id="home" className="hero">
      <div className="hero-overlay"></div>
      {isMobile && (
        <div className="hero-mobile-bg">
          <ImageCrossfade images={mobileImages} interval={4000} />
          <div className="hero-mobile-bg__overlay"></div>
        </div>
      )}
      {!isMobile && (
        <div className="hero-slider hero-slider-left">
          <div ref={leftRef} id="three-container-left"></div>
        </div>
      )}
      <div className="hero-content">
        <h1 className="hero-title">TREND</h1>
        <p className="hero-subtitle">{t(translations.hero.subtitle)}</p>
        <p className="hero-tagline">{t(translations.hero.tagline)}</p>
        <a
          href="https://studio24.bg"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          {t(translations.hero.bookBtn)}
        </a>
      </div>
      {!isMobile && (
        <div className="hero-slider hero-slider-right">
          <div ref={rightRef} id="three-container-right"></div>
        </div>
      )}
      <div className="scroll-indicator">
        <span></span>
      </div>
    </section>
  )
}
