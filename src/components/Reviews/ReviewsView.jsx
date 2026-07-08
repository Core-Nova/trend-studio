import { SectionHeader } from '../atoms/SectionHeader'
import { RatingBadge } from './RatingBadge'
import { ReviewsCarousel } from './ReviewsCarousel'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { trackEvent } from '../../lib/analytics'
import bgImage from '../../assets/backgrounds/reviews-bg.jpg'

const trackGoogleReviews = () => trackEvent('select_content', { content_type: 'google_reviews', location: 'reviews_section' })

export const ReviewsView = ({
  sectionTag, title, googleBtn, note, googleUrl,
  rating, totalCount, reviews, lang
}) => {
  const { ref, revealed } = useScrollReveal()
  return (
  <section id="reviews" className="reviews reviews--bg" style={{ backgroundImage: `url(${bgImage})` }}>
    <div className={`container scroll-reveal ${revealed ? 'scroll-reveal--visible' : ''}`} ref={ref}>
      <SectionHeader tag={sectionTag} title={title} />
      <RatingBadge rating={rating} totalCount={totalCount} profileUrl={googleUrl} />
      <ReviewsCarousel reviews={reviews} lang={lang} googleUrl={googleUrl} />
      <div className="google-reviews-link">
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          onClick={trackGoogleReviews}
        >
          <span className="google-icon">G</span>
          <span>{googleBtn}</span>
        </a>
      </div>
      <p className="reviews-note">{note}</p>
    </div>
  </section>
  )
}
