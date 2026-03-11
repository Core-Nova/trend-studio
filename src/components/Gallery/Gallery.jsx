import { useGallery } from '../../hooks/useGallery'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useStories } from '../../hooks/useStories'
import { useLightbox } from '../../hooks/useLightbox'
import { allImages, allImageUrls, featuredImages, STORY_GROUPS } from '../../data/imageImports'
import { GalleryView } from './GalleryView'

export const Gallery = ({ showSeeAll = false }) => {
  const data = useGallery()
  const isMobile = useIsMobile()
  const stories = useStories({ images: allImageUrls, duration: 5000 })
  const lightbox = useLightbox(allImages.length)

  return (
    <GalleryView
      {...data}
      showSeeAll={showSeeAll}
      isMobile={isMobile}
      stories={stories}
      lightbox={lightbox}
      allImages={allImages}
      allImageUrls={allImageUrls}
      featuredImages={featuredImages}
      storyGroups={STORY_GROUPS}
    />
  )
}
