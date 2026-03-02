import { useState, useEffect, useCallback } from 'react'

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

export const ReviewsCarousel = ({ reviews, lang }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const next = useCallback(() => {
    setActiveIndex(p => (p + 1) % reviews.length)
  }, [reviews.length])

  const prev = useCallback(() => {
    setActiveIndex(p => (p - 1 + reviews.length) % reviews.length)
  }, [reviews.length])

  useEffect(() => {
    if (isPaused || reviews.length < 2) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [isPaused, reviews.length, next])

  if (!reviews.length) return null

  const review = reviews[activeIndex]
  const text = review.text[lang] || review.text.en

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
          <div className="review-card__author">
            <span className="review-card__avatar">{review.name.charAt(0)}</span>
            <div className="review-card__meta">
              <span className="review-card__name">{review.name}</span>
              <span className="review-card__date">{formatDate(review.date)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="reviews-carousel__nav">
        <button onClick={prev} className="reviews-carousel__btn" aria-label="Previous review">&#8249;</button>
        <div className="reviews-carousel__dots">
          {reviews.map((_, i) => (
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
