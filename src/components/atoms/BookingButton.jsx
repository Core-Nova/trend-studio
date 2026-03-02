import { memo } from 'react'

export const BookingButton = memo(({ text, url = 'https://studio24.bg/hair-boutique-studio-trend-s4258', className = '' }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className={`btn btn-primary ${className}`}
  >
    {text}
  </a>
))
