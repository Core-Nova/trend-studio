import { useState, useEffect, useCallback } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'

const StarRow = ({ rating }) => (
  <div className="review-card__stars">
    {Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'star--filled' : 'star--empty'}>&#9733;</span>
    ))}
  </div>
)

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const CHAR_LIMIT_MOBILE = 120
const CHAR_LIMIT_DESKTOP = 350

function truncateText(text, limit) {
  if (text.length <= limit) return text
  return text.slice(0, limit).trimEnd() + '…'
}

export const ReviewsCarousel = ({ reviews, lang, googleUrl }) => {
  const top10 = reviews.slice(0, 10)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const isMobile = useIsMobile()

  const next = useCallback(() => {
    setActiveIndex(p => (p + 1) % top10.length)
  }, [top10.length])

  const prev = useCallback(() => {
    setActiveIndex(p => (p - 1 + top10.length) % top10.length)
  }, [top10.length])

  useEffect(() => {
    if (isPaused || top10.length < 2) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [isPaused, top10.length, next])

  if (!top10.length) return null

  const review = top10[activeIndex]
  const rawText = review.text[lang] || review.text.en
  const text = truncateText(rawText, isMobile ? CHAR_LIMIT_MOBILE : CHAR_LIMIT_DESKTOP)

  return (
    <div
      className="reviews-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="reviews-carousel__track">
        <div className="review-card">
          <StarRow rating={review.rating} />
          <blockquote className="review-card__text">
            &ldquo;{text}&rdquo;
          </blockquote>
          <a
            className="review-card__author"
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="review-card__avatar">{review.name.charAt(0)}</span>
            <div className="review-card__meta">
              <span className="review-card__name">{review.name}</span>
              <span className="review-card__date">{formatDate(review.date)}</span>
            </div>
          </a>
        </div>
      </div>
      <div className="reviews-carousel__nav">
        <button onClick={prev} className="reviews-carousel__btn" aria-label="Previous review">&#8249;</button>
        <div className="reviews-carousel__dots">
          {top10.map((_, i) => (
            <button
              key={i}
              className={`reviews-carousel__dot ${i === activeIndex ? 'reviews-carousel__dot--active' : ''}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to review ${i + 1}`}
            />
          ))}
        </div>
        <button onClick={next} className="reviews-carousel__btn" aria-label="Next review">&#8250;</button>
      </div>
    </div>
  )
}
