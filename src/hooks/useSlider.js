/* globals THREE, TweenMax */
import { useRef, useState, useEffect } from 'react'

const PLANE_WIDTH = 63
const PLANE_HEIGHT = 112

export const useSlider = ({
  containerRef,
  images,
  width = PLANE_WIDTH,
  height = PLANE_HEIGHT,
  delay = 0,
  autoPlay = true,
  enabled = true
}) => {
  const [ready, setReady] = useState(false)
  const controlsRef = useRef(null)

  useEffect(() => {
    if (!enabled || !images.length) return

    let mounted = true
    let pollTimer = null

    const tryInit = () => {
      if (!mounted) return
      if (typeof THREE === 'undefined' || typeof THREE.BAS === 'undefined' || typeof TweenMax === 'undefined') {
        pollTimer = setTimeout(tryInit, 200)
        return
      }

      import('../lib/slider.js').then(({ createImageSlider }) => {
        if (!mounted || !containerRef.current) return

        const slider = createImageSlider({
          container: containerRef.current,
          images,
          width,
          height,
          delay,
          autoPlay,
          onReady: () => {
            if (!mounted) return
            setReady(true)
          }
        })

        if (slider) {
          controlsRef.current = slider
        }
      }).catch(() => {})
    }

    tryInit()

    return () => {
      mounted = false
      if (pollTimer) clearTimeout(pollTimer)
      if (controlsRef.current) {
        controlsRef.current.dispose()
        controlsRef.current = null
      }
      setReady(false)
    }
  }, [enabled, images, width, height, delay, autoPlay])

  return { ready, controls: controlsRef }
}
