import { useState, useEffect } from 'react'

export const ImageCrossfade = ({ images, interval = 4000, className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!images.length) return
    const img = new Image()
    img.onload = () => setLoaded(true)
    img.src = images[0]
  }, [images])

  useEffect(() => {
    if (!loaded || images.length < 2) return

    const timer = setInterval(() => {
      setCurrentIndex(prev => {
        const next = (prev + 1) % images.length
        const preload = new Image()
        preload.src = images[(next + 1) % images.length]
        return next
      })
    }, interval)

    return () => clearInterval(timer)
  }, [loaded, images.length, interval])

  if (!images.length) return null

  const prevIndex = (currentIndex - 1 + images.length) % images.length

  return (
    <div className={`image-crossfade ${className}`}>
      <img
        src={images[prevIndex]}
        alt="TREND Hair Boutique Studio"
        className="image-crossfade__img"
      />
      <img
        src={images[currentIndex]}
        alt="TREND Hair Boutique Studio"
        className="image-crossfade__img image-crossfade__img--active"
      />
    </div>
  )
}
