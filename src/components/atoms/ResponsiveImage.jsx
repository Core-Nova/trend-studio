import { memo } from 'react'

/**
 * Renders a <picture> with AVIF + WebP <source> elements and a final <img>
 * fallback. Accepts the responsive variants produced by imageImports.js.
 *
 * Props beyond the image data are spread onto the <img> so callers can pass
 * loading="lazy", fetchpriority="high", className, onClick, etc.
 */
export const ResponsiveImage = memo(({
  src,
  srcSetWebp,
  srcSetAvif,
  sizes,
  alt,
  width,
  height,
  ...imgProps
}) => (
  <picture>
    {srcSetAvif && <source type="image/avif" srcSet={srcSetAvif} sizes={sizes} />}
    {srcSetWebp && <source type="image/webp" srcSet={srcSetWebp} sizes={sizes} />}
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      {...imgProps}
    />
  </picture>
))
