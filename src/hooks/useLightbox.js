import { useState, useCallback, useEffect, useRef } from 'react'

export const useLightbox = (totalImages) => {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const lightboxRef = useRef(null)

  const open = useCallback((index) => setLightboxIndex(index), [])
  const close = useCallback(() => setLightboxIndex(null), [])
  const prev = useCallback(() => setLightboxIndex(p => (p - 1 + totalImages) % totalImages), [totalImages])
  const next = useCallback(() => setLightboxIndex(p => (p + 1) % totalImages), [totalImages])

  useEffect(() => {
    if (lightboxIndex !== null && lightboxRef.current) {
      lightboxRef.current.focus()
    }
  }, [lightboxIndex])

  return { lightboxIndex, lightboxRef, open, close, prev, next }
}
