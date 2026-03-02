import { SectionHeader } from '../atoms/SectionHeader'
import { RatingBadge } from './RatingBadge'
import { ReviewsCarousel } from './ReviewsCarousel'

export const ReviewsView = ({
  sectionTag, title, googleBtn, note, googleUrl,
  rating, totalCount, reviews, lang
}) => (
  <section id="reviews" className="reviews">
    <div className="container">
      <SectionHeader tag={sectionTag} title={title} />
      <RatingBadge rating={rating} totalCount={totalCount} profileUrl={googleUrl} />
      <ReviewsCarousel reviews={reviews} lang={lang} />
      <div className="google-reviews-link">
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
        >
          <span className="google-icon">G</span>
          <span>{googleBtn}</span>
        </a>
      </div>
      <p className="reviews-note">{note}</p>
    </div>
  </section>
)
