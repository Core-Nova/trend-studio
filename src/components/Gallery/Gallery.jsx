import { useGallery } from '../../hooks/useGallery'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useStories } from '../../hooks/useStories'
import { useLightbox } from '../../hooks/useLightbox'
import { useCarousel } from '../../hooks/useCarousel'
import { allImages, allImageUrls, STORY_GROUPS } from '../../data/imageImports'
import { GalleryView } from './GalleryView'

export const Gallery = ({ showSeeAll = false }) => {
  const data = useGallery()
  const isMobile = useIsMobile()
  const stories = useStories({ images: allImageUrls, duration: 5000 })
  const lightbox = useLightbox(allImages.length)
  const carousel = useCarousel({ totalItems: allImages.length, visibleCount: 3, interval: 5000 })

  return (
    <GalleryView
      {...data}
      showSeeAll={showSeeAll}
      isMobile={isMobile}
      stories={stories}
      lightbox={lightbox}
      carousel={carousel}
      allImages={allImages}
      allImageUrls={allImageUrls}
      storyGroups={STORY_GROUPS}
    />
  )
}
