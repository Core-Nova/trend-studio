import { useRef, useEffect } from 'react'
import { useIsMobile } from './useIsMobile'
import { imageData } from '../data/imageImports'

export const useHeroSliders = () => {
  const isMobile = useIsMobile()
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const disposersRef = useRef([])

  useEffect(() => {
    if (isMobile || typeof THREE === 'undefined' || typeof TweenMax === 'undefined') return

    let mounted = true

    import('../lib/slider.js').then(({ createImageSlider }) => {
      if (!mounted) return

      if (leftRef.current && imageData.hero_left.length) {
        const d = createImageSlider({
          container: leftRef.current,
          images: imageData.hero_left,
          width: 70,
          height: 105
        })
        if (d) disposersRef.current.push(d)
      }

      if (rightRef.current && imageData.hero_right.length) {
        const d = createImageSlider({
          container: rightRef.current,
          images: imageData.hero_right,
          width: 70,
          height: 105
        })
        if (d) disposersRef.current.push(d)
      }
    })

    return () => {
      mounted = false
      disposersRef.current.forEach(d => d())
      disposersRef.current = []
    }
  }, [isMobile])

  return { leftRef, rightRef, isMobile }
}
