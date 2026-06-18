/* globals THREE, TweenMax */
import { useRef, useEffect } from 'react'
import { useIsMobile } from './useIsMobile'
import { imageData } from '../data/imageImports'

// World-space plane dimensions for the WebGL sliders. The ratio (63/112) is
// exactly 9:16 — identical to the hero images — so they map without distortion.
// The CSS box (.hero-slider) carries the same 9:16 ratio, and the camera in
// slider.js is positioned to fit this plane exactly at any viewport size.
const PLANE_WIDTH = 63
const PLANE_HEIGHT = 112

// Below this width the two side sliders would be too narrow to look good, so
// the hero falls back to the full-bleed crossfade (same imagery, no slivers).
const HERO_SLIDER_BREAKPOINT = 992

export const useHeroSliders = () => {
  const isMobile = useIsMobile(HERO_SLIDER_BREAKPOINT)
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const disposersRef = useRef([])

  useEffect(() => {
    if (isMobile) return

    let mounted = true
    let pollTimer = null

    const tryInit = () => {
      if (!mounted) return
      if (typeof THREE === 'undefined' || typeof THREE.BAS === 'undefined' || typeof TweenMax === 'undefined') {
        pollTimer = setTimeout(tryInit, 200)
        return
      }

      import('../lib/slider.js').then(({ createImageSlider }) => {
        if (!mounted) return

        if (leftRef.current && imageData.hero_left.length) {
          const d = createImageSlider({
            container: leftRef.current,
            images: imageData.hero_left,
            width: PLANE_WIDTH,
            height: PLANE_HEIGHT
          })
          if (d) disposersRef.current.push(d)
        }

        if (rightRef.current && imageData.hero_right.length) {
          const d = createImageSlider({
            container: rightRef.current,
            images: imageData.hero_right,
            width: PLANE_WIDTH,
            height: PLANE_HEIGHT
          })
          if (d) disposersRef.current.push(d)
        }
      }).catch(() => { })
    }

    tryInit()

    return () => {
      mounted = false
      if (pollTimer) clearTimeout(pollTimer)
      disposersRef.current.forEach(d => d())
      disposersRef.current = []
    }
  }, [isMobile])

  return { leftRef, rightRef, isMobile }
}
