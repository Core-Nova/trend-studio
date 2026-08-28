import { memo } from 'react'

/**
 * Section header with the gold tag, large title, and ornament line.
 * Pass `logo={{ webp, avif, alt }}` to render the brand mark in place
 * of a text title (used by the About / "Welcome to TREND" section).
 *
 * `as` sets the heading level. It defaults to h2, which is right on the home
 * page where these sit under the hero's h1 — but on a dedicated route the
 * section header IS the page title, so those pass `as="h1"` (every inner page
 * previously rendered with no h1 at all). Styling hangs off `.section-title`,
 * not the tag, so the level changes nothing visually.
 */
export const SectionHeader = memo(({ tag, title, logo, as = 'h2' }) => {
  // Assigned to a capitalised local rather than renamed in the destructure so
  // JSX treats it as a component (and so no-unused-vars' varsIgnorePattern
  // covers it — argsIgnorePattern is not configured).
  const Heading = as
  return (
    <div className="section-header">
      <span className="section-tag">{tag}</span>
      {logo ? (
        <Heading className="section-title section-title--logo">
          <picture>
            {logo.avif && <source type="image/avif" srcSet={logo.avif} />}
            <img src={logo.webp} alt={logo.alt ?? title} />
          </picture>
          {title && <span className="sr-only">{title}</span>}
        </Heading>
      ) : (
        <Heading className="section-title">{title}</Heading>
      )}
      <div className="ornament"></div>
    </div>
  )
})
