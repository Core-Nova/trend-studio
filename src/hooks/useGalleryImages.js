import { allImages, STORY_GROUPS } from '../data/imageImports'

/* Computed once at module scope — consumers pass these to effect deps
   (useStories, useCarousel), so the identities must be stable. */
const IMAGE_URLS = allImages.map(img => img.src)
const GALLERY_IMAGES = {
  images: allImages,
  imageUrls: IMAGE_URLS,
  storyGroups: STORY_GROUPS,
}

/**
 * Gallery image source shared by the home Gallery section and GalleryPage —
 * the bundled salon images and their story groups from imageImports.
 */
export const useGalleryImages = () => GALLERY_IMAGES
