import { ImageCrossfade } from '../ImageCrossfade/ImageCrossfade'
import { BookingButton } from '../atoms/BookingButton'
import { ResponsiveImage } from '../atoms/ResponsiveImage'
import { RatingBadge } from '../Reviews/RatingBadge'
import { imageData, allImages } from '../../data/imageImports'
import { googleReviews } from '../../data/reviews'
import logoSrc from '../../assets/brand/trend-logo.png?w=1378&format=webp&quality=92'
import logoSrcAvif from '../../assets/brand/trend-logo.png?w=1378&format=avif&quality=80'

const mobileImages = [...imageData.hero_left, ...imageData.hero_right]

export const HeroView = ({ subtitle, tagline, bookBtn, isMobile, leftRef, rightRef }) => (
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
        <ResponsiveImage
          src={imageData.hero_left[0]}
          srcSetWebp={allImages[0].srcSetWebp}
          srcSetAvif={allImages[0].srcSetAvif}
          sizes="50vw"
          alt={allImages[0].alt}
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
        <span className="sr-only">TREND</span>
      </h1>
      <p className="hero-tagline">{tagline}</p>
      <BookingButton translations={bookBtn} />
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
          src={imageData.hero_right[0]}
          srcSetWebp={allImages[4].srcSetWebp}
          srcSetAvif={allImages[4].srcSetAvif}
          sizes="50vw"
          alt={allImages[4].alt}
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
