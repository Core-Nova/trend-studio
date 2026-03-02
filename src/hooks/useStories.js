import { useState, useRef, useCallback, useEffect } from 'react'

export const useStories = ({ images, duration = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(null)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const rafRef = useRef(null)
  const startTimeRef = useRef(null)
  const pausedAtRef = useRef(0)

  const isOpen = currentIndex !== null

  const stopTimer = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    startTimeRef.current = performance.now() - (pausedAtRef.current * duration)

    const tick = (now) => {
      const elapsed = now - startTimeRef.current
      const p = Math.min(elapsed / duration, 1)
      setProgress(p)

      if (p >= 1) {
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [duration, stopTimer])

  useEffect(() => {
    if (progress >= 1 && isOpen && !isPaused) {
      if (currentIndex < images.length - 1) {
        setCurrentIndex(prev => prev + 1)
        pausedAtRef.current = 0
        setProgress(0)
      } else {
        setCurrentIndex(null)
        setProgress(0)
        pausedAtRef.current = 0
      }
    }
  }, [progress, isOpen, isPaused, currentIndex, images.length])

  useEffect(() => {
    if (isOpen && !isPaused) {
      startTimer()
    } else {
      stopTimer()
    }
    return stopTimer
  }, [isOpen, isPaused, currentIndex, startTimer, stopTimer])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const open = useCallback((index) => {
    pausedAtRef.current = 0
    setProgress(0)
    setIsPaused(false)
    setCurrentIndex(index)
  }, [])

  const close = useCallback(() => {
    stopTimer()
    setCurrentIndex(null)
    setProgress(0)
    pausedAtRef.current = 0
    setIsPaused(false)
  }, [stopTimer])

  const next = useCallback(() => {
    if (currentIndex < images.length - 1) {
      pausedAtRef.current = 0
      setProgress(0)
      setCurrentIndex(prev => prev + 1)
    } else {
      close()
    }
  }, [currentIndex, images.length, close])

  const prev = useCallback(() => {
    pausedAtRef.current = 0
    setProgress(0)
    setCurrentIndex(p => Math.max(0, p - 1))
  }, [])

  const pause = useCallback(() => {
    pausedAtRef.current = progress
    setIsPaused(true)
  }, [progress])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  return { currentIndex, progress, isOpen, open, close, next, prev, pause, resume }
}
