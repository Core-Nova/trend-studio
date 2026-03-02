import { ImageCrossfade } from '../ImageCrossfade/ImageCrossfade'
import { BookingButton } from '../atoms/BookingButton'
import { RatingBadge } from '../Reviews/RatingBadge'
import { imageData } from '../../data/imageImports'
import { googleReviews } from '../../data/reviews'

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
        <img src={imageData.hero_left[0]} alt="TREND salon" className="hero-slider__preview" />
        <div ref={leftRef} id="three-container-left"></div>
      </div>
    )}
    <div className="hero-content">
      <h1 className="hero-title">TREND</h1>
      <p className="hero-subtitle">{subtitle}</p>
      <p className="hero-tagline">{tagline}</p>
      <BookingButton text={bookBtn} />
      <RatingBadge
        rating={googleReviews.rating}
        totalCount={googleReviews.totalCount}
        profileUrl={googleReviews.profileUrl}
        compact
      />
    </div>
    {!isMobile && (
      <div className="hero-slider hero-slider-right">
        <img src={imageData.hero_right[0]} alt="TREND salon" className="hero-slider__preview" />
        <div ref={rightRef} id="three-container-right"></div>
      </div>
    )}
    <div className="scroll-indicator">
      <span></span>
    </div>
  </section>
)
