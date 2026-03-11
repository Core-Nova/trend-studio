import { useState, useCallback, useEffect, useRef } from 'react'

export const useCarousel = ({ totalItems, visibleCount = 3, interval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef(null)
  const maxIndex = totalItems - visibleCount

  const next = useCallback(() => {
    setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1)
  }, [maxIndex])

  const prev = useCallback(() => {
    setCurrentIndex(prev => prev <= 0 ? maxIndex : prev - 1)
  }, [maxIndex])

  const goTo = useCallback((index) => {
    setCurrentIndex(Math.max(0, Math.min(index, maxIndex)))
  }, [maxIndex])

  const pause = useCallback(() => setIsPaused(true), [])
  const resume = useCallback(() => setIsPaused(false), [])

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(next, interval)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isPaused, interval, next])

  return { currentIndex, maxIndex, next, prev, goTo, pause, resume, isPaused }
}
