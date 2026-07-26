import { preload } from 'react-dom'
import { ImageCrossfade } from '../ImageCrossfade/ImageCrossfade'
import { BookingButton } from '../atoms/BookingButton'
import { ResponsiveImage } from '../atoms/ResponsiveImage'
import { RatingBadge } from '../Reviews/RatingBadge'
import { imageData, heroPreviews } from '../../data/imageImports'
import { googleReviews } from '../../data/reviews'
import logoSrc from '../../assets/brand/trend-logo.png?w=1378&format=webp&quality=92'
import logoSrcAvif from '../../assets/brand/trend-logo.png?w=1378&format=avif&quality=80'

const mobileImages = [...imageData.hero_left, ...imageData.hero_right]

/* Fetch the first hero frame(s) as early as possible (before React paints the
   <picture>), so the LCP image is warm in cache when the hero renders. AVIF
   only — `type` makes browsers that can't decode it skip the hint instead of
   double-downloading. Mobile shows one full-bleed slider (hero_left[0]);
   desktop shows both columns. */
const preloadHero = isMobile => {
  const sizes = isMobile ? '100vw' : '50vw'
  preload(heroPreviews.left.src, {
    as: 'image',
    imageSrcSet: heroPreviews.left.srcSetAvif,
    imageSizes: sizes,
    fetchPriority: 'high',
    type: 'image/avif',
  })
  if (!isMobile) {
    preload(heroPreviews.right.src, {
      as: 'image',
      imageSrcSet: heroPreviews.right.srcSetAvif,
      imageSizes: sizes,
      fetchPriority: 'high',
      type: 'image/avif',
    })
  }
}

export const HeroView = ({ tagline, bookBtn, isMobile, leftRef, rightRef, mobileRef, sliderReady }) => {
  preloadHero(isMobile)
  return (
  <section id="home" className="hero">
    <div className="hero-overlay"></div>
    {isMobile && (
      <div className="hero-mobile-bg">
        {!sliderReady && <ImageCrossfade images={mobileImages} interval={4000} />}
        <div ref={mobileRef} className="hero-mobile-slider" />
        <div className="hero-mobile-bg__overlay"></div>
      </div>
    )}
    {!isMobile && (
      <div className="hero-slider hero-slider-left">
        <ResponsiveImage
          src={heroPreviews.left.src}
          srcSetWebp={heroPreviews.left.srcSetWebp}
          srcSetAvif={heroPreviews.left.srcSetAvif}
          sizes="50vw"
          alt={heroPreviews.left.alt}
          className="hero-slider__preview"
          fetchpriority="high"
          loading="eager"
        />
        <div ref={leftRef} id="three-container-left"></div>
      </div>
    )}
    <div className="hero-content">
      <h1 className="hero-title hero-title--logo">
        <picture>
          <source type="image/avif" srcSet={logoSrcAvif} />
          <img src={logoSrc} alt="TREND Hair Boutique Studio" fetchpriority="high" />
        </picture>
        <span className="sr-only">
          TREND Hair Boutique Studio — Best Hairdresser in Central Sofia ·
          TREND Бутиково фризьорско студио — фризьор в центъра на София
        </span>
      </h1>
      <p className="hero-tagline">{tagline}</p>
      <BookingButton translations={bookBtn} location="hero" />
      <RatingBadge
        rating={googleReviews.rating}
        totalCount={googleReviews.totalCount}
        profileUrl={googleReviews.profileUrl}
        compact
      />
    </div>
    {!isMobile && (
      <div className="hero-slider hero-slider-right">
        <ResponsiveImage
          src={heroPreviews.right.src}
          srcSetWebp={heroPreviews.right.srcSetWebp}
          srcSetAvif={heroPreviews.right.srcSetAvif}
          sizes="50vw"
          alt={heroPreviews.right.alt}
          className="hero-slider__preview"
          fetchpriority="high"
          loading="eager"
        />
        <div ref={rightRef} id="three-container-right"></div>
      </div>
    )}
    <div className="scroll-indicator">
      <span></span>
    </div>
  </section>
  )
}
