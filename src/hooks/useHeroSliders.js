import { useRef } from 'react'
import { useIsMobile } from './useIsMobile'
import { useSlider } from './useSlider'
import { imageData } from '../data/imageImports'

const HERO_SLIDER_BREAKPOINT = 992

const mobileImages = [...imageData.hero_left, ...imageData.hero_right]

export const useHeroSliders = () => {
  const isMobile = useIsMobile(HERO_SLIDER_BREAKPOINT)
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const mobileRef = useRef(null)

  const { ready: leftReady } = useSlider({
    containerRef: leftRef,
    images: imageData.hero_left,
    enabled: !isMobile
  })

  const { ready: rightReady } = useSlider({
    containerRef: rightRef,
    images: imageData.hero_right,
    enabled: !isMobile
  })

  const { ready: mobileReady } = useSlider({
    containerRef: mobileRef,
    images: mobileImages,
    enabled: isMobile
  })

  return {
    leftRef,
    rightRef,
    mobileRef,
    isMobile,
    sliderReady: isMobile ? mobileReady : (leftReady && rightReady)
  }
}
