import { useMemo } from 'react'
import { useInstagramFeed } from './useInstagramFeed'
import { allImages, STORY_GROUPS } from '../data/imageImports'

/** Splits live Instagram posts into story groups for the mobile highlights row. */
const buildStoryGroups = (images, labels) => {
  const groups = []
  const perGroup = Math.ceil(images.length / labels.length)
  labels.forEach((label, i) => {
    const startIndex = i * perGroup
    if (startIndex < images.length) {
      groups.push({ label, thumbnail: images[startIndex].thumb ?? images[startIndex].src, startIndex })
    }
  })
  return groups
}

/**
 * Gallery image source shared by the home Gallery section and GalleryPage:
 * prefers the live Instagram feed (via the backend), falls back to the
 * bundled salon images when the backend is unavailable or unconfigured.
 */
export const useGalleryImages = (limit = 12) => {
  const instagramPosts = useInstagramFeed(limit)

  return useMemo(() => {
    if (instagramPosts?.length) {
      const images = instagramPosts.map((p, i) => ({
        src: p.mediaUrl,
        alt: p.caption?.slice(0, 100) || `TREND salon Instagram post ${i + 1}`,
        permalink: p.permalink,
      }))
      return {
        images,
        imageUrls: images.map(img => img.src),
        storyGroups: buildStoryGroups(images, ['Latest', 'Styles', 'Salon']),
        isLive: true,
      }
    }
    return {
      images: allImages,
      imageUrls: allImages.map(img => img.src),
      storyGroups: STORY_GROUPS,
      isLive: false,
    }
  }, [instagramPosts])
}
