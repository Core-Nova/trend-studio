---
name: threejs-slider-react
description: Integrate, modify, or debug the Three.js triangle slider effect in the TREND React app. Use when working on slider components, the hero section, gallery section, or any Three.js animation code.
---

# Three.js Slider in React

## Prerequisites Check

Before writing any slider code, verify:

1. CDN script tags exist in `index.html` `<head>`:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r73/three.min.js"></script>
<script src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/bas.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/1.18.0/TweenMax.min.js"></script>
```

2. The slider module exists at `src/lib/slider.js`

3. Slider images are provided by the React app, typically via Vite-imported assets from `src/data/imageImports.js`

## Adding a Slider to a Component

Use `createImageSlider` from `src/lib/slider.js`. It takes a container element and returns a dispose function.

```jsx
import { useRef, useEffect } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'
import { createImageSlider } from '../lib/slider'

export const HeroSlider = ({ images, width, height, delay = 0 }) => {
  const containerRef = useRef(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobile || !containerRef.current || !images.length) return
    if (typeof THREE === 'undefined') return

    const dispose = createImageSlider({
      container: containerRef.current,
      images,
      width,
      height,
      delay
    })

    return dispose
  }, [isMobile, images, width, height, delay])

  if (isMobile) return null

  return <div ref={containerRef} className="hero-slider" />
}
```

## Adding Gallery Sliders

Use `createGallerySliders` for the 4-container gallery layout:

```jsx
import { useRef, useEffect } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'
import { createGallerySliders } from '../lib/slider'

export const GallerySliders = ({ images }) => {
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)]
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobile || !images.length) return
    if (typeof THREE === 'undefined') return

    const containers = refs.map(r => r.current).filter(Boolean)
    if (!containers.length) return

    const dispose = createGallerySliders({
      containers,
      images,
      staggerDelay: 200
    })

    return dispose
  }, [isMobile, images])

  if (isMobile) return null

  return (
    <div className="gallery-sliders-container">
      {refs.map((ref, i) => (
        <div key={i} ref={ref} className="gallery-three-container" />
      ))}
    </div>
  )
}
```

## Slider Configurations

| Placement | Width | Height | Delay |
|-----------|-------|--------|-------|
| Hero left | 70 | 105 | 0 |
| Hero right | 70 | 105 | 500ms (via setTimeout in parent) |
| Gallery x4 | 120 | 160 | i * 200ms (automatic via staggerDelay) |

## Mobile Fallback

The slider is desktop-only. When `useIsMobile()` returns true, render a CSS crossfade instead. The slider module itself also guards against missing `THREE` global.

## Modifying Images

Edit `src/data/imageImports.js` and the files under `src/assets/images/**`. All slider images should be local assets imported by Vite (no external CDN URLs in normal operation).

## Debugging

- Open browser DevTools console -- look for WebGL errors or image load failures
- If the slider shows a black rectangle, images failed to load (check CORS, check URLs)
- If the page slows down, check for WebGL context leaks (dispose not called on unmount)
- The slider requires Three.js r73 -- do NOT upgrade

## Additional Resources

For detailed API docs and architecture details, see [reference.md](reference.md).
