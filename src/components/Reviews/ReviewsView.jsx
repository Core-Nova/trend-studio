import { SectionHeader } from '../atoms/SectionHeader'
import { RatingBadge } from './RatingBadge'
import { ReviewsCarousel } from './ReviewsCarousel'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import bgImage from '../../assets/images/gallery/evapostedit3.jpg'

export const ReviewsView = ({
  sectionTag, title, googleBtn, note, googleUrl,
  rating, totalCount, reviews, lang
}) => {
  const { ref, revealed } = useScrollReveal()
  return (
  <section id="reviews" className={`reviews reviews--bg scroll-reveal ${revealed ? 'scroll-reveal--visible' : ''}`} style={{ backgroundImage: `url(${bgImage})` }} ref={ref}>
    <div className="container">
      <SectionHeader tag={sectionTag} title={title} />
      <RatingBadge rating={rating} totalCount={totalCount} profileUrl={googleUrl} />
      <ReviewsCarousel reviews={reviews} lang={lang} googleUrl={googleUrl} />
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
}
