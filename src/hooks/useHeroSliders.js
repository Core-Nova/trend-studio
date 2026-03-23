import { useRef, useEffect } from 'react'
import { useIsMobile } from './useIsMobile'
import { imageData, allImages } from '../data/imageImports'

export const useHeroSliders = () => {
  const isMobile = useIsMobile()
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const disposersRef = useRef([])

  useEffect(() => {
    if (isMobile) return

    let mounted = true
    let pollTimer = null

    const updateBannerWidths = () => {
      const homeDiv = document.getElementById('home')
      if (!homeDiv || !leftRef.current || !rightRef.current) return

      const homeHeight = homeDiv.clientHeight

      const leftImg = allImages.find(img => img.src === imageData.hero_left[0])
      if (leftImg && leftRef.current.parentElement) {
        const leftRatio = leftImg.width / leftImg.height
        leftRef.current.parentElement.style.width = `${homeHeight * leftRatio}px`
      }

      const rightImg = allImages.find(img => img.src === imageData.hero_right[0])
      if (rightImg && rightRef.current.parentElement) {
        const rightRatio = rightImg.width / rightImg.height
        rightRef.current.parentElement.style.width = `${homeHeight * rightRatio}px`
      }
    }

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
      }).catch(() => { })
    }

    tryInit()
    updateBannerWidths()
    window.addEventListener('resize', updateBannerWidths)

    return () => {
      mounted = false
      if (pollTimer) clearTimeout(pollTimer)
      window.removeEventListener('resize', updateBannerWidths)
      disposersRef.current.forEach(d => d())
      disposersRef.current = []
    }
  }, [isMobile])

  return { leftRef, rightRef, isMobile }
}
