import { memo } from 'react'

export const RatingBadge = memo(({ rating, totalCount, profileUrl, compact = false }) => (
  <a
    href={profileUrl}
    target="_blank"
    rel="noopener noreferrer"
    className={`rating-badge ${compact ? 'rating-badge--compact' : ''}`}
  >
    <span className="rating-badge__stars">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`rating-badge__star ${i < Math.round(rating) ? 'rating-badge__star--filled' : ''}`}>
          &#9733;
        </span>
      ))}
    </span>
    <span className="rating-badge__rating">{rating.toFixed(1)}</span>
    <span className="rating-badge__divider">|</span>
    <span className="rating-badge__count">{totalCount}</span>
    <span className="rating-badge__google">
      <span className="rating-badge__g">G</span> Reviews
    </span>
  </a>
))
