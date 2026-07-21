import { useGallery } from '../../hooks/useGallery'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useStories } from '../../hooks/useStories'
import { useLightbox } from '../../hooks/useLightbox'
import { useCarousel } from '../../hooks/useCarousel'
import { useGalleryImages } from '../../hooks/useGalleryImages'
import { GalleryView } from './GalleryView'

export const Gallery = ({ showSeeAll = false }) => {
  const data = useGallery()
  const isMobile = useIsMobile()
  const { images, imageUrls, storyGroups } = useGalleryImages()

  const stories = useStories({ images: imageUrls, duration: 5000 })
  const lightbox = useLightbox(images.length)
  const carousel = useCarousel({ totalItems: images.length, visibleCount: 6, interval: 5000 })

  return (
    <GalleryView
      {...data}
      showSeeAll={showSeeAll}
      isMobile={isMobile}
      stories={stories}
      lightbox={lightbox}
      carousel={carousel}
      allImages={images}
      allImageUrls={imageUrls}
      storyGroups={storyGroups}
    />
  )
}
