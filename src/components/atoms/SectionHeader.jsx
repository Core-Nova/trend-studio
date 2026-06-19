import { memo } from 'react'

/**
 * Section header with the gold tag, large title, and ornament line.
 * Pass `logo={{ webp, avif, alt }}` to render the brand mark in place
 * of a text title (used by the About / "Welcome to TREND" section).
 */
export const SectionHeader = memo(({ tag, title, logo }) => (
  <div className="section-header">
    <span className="section-tag">{tag}</span>
    {logo ? (
      <h2 className="section-title section-title--logo">
        <picture>
          {logo.avif && <source type="image/avif" srcSet={logo.avif} />}
          <img src={logo.webp} alt={logo.alt ?? title} />
        </picture>
        {title && <span className="sr-only">{title}</span>}
      </h2>
    ) : (
      <h2 className="section-title">{title}</h2>
    )}
    <div className="ornament"></div>
  </div>
))
