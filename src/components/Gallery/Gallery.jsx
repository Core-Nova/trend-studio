import { useRef, useEffect } from 'react'
import { useGallery } from '../../hooks/useGallery'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useStories } from '../../hooks/useStories'
import { allImages, STORY_GROUPS } from '../../data/imageImports'
import { GalleryView } from './GalleryView'

export const Gallery = ({ showSeeAll = false }) => {
  const data = useGallery()
  const isMobile = useIsMobile()
  const stories = useStories({ images: allImages, duration: 5000 })

  const containerRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]
  const disposeRef = useRef(null)

  useEffect(() => {
    if (isMobile) return

    let mounted = true
    let pollTimer = null

    const tryInit = () => {
      if (!mounted) return
      if (typeof THREE === 'undefined') {
        pollTimer = setTimeout(tryInit, 200)
        return
      }

      import('../../lib/slider.js').then(({ createGallerySliders }) => {
        if (!mounted) return
        const containers = containerRefs.map(r => r.current).filter(Boolean)
        if (!containers.length || !data.images.length) return

        disposeRef.current = createGallerySliders({
          containers,
          images: data.images,
          staggerDelay: 200
        })
      })
    }

    tryInit()

    return () => {
      mounted = false
      if (pollTimer) clearTimeout(pollTimer)
      if (disposeRef.current) disposeRef.current()
      disposeRef.current = null
    }
  }, [isMobile, data.images])

  return (
    <GalleryView
      {...data}
      showSeeAll={showSeeAll}
      isMobile={isMobile}
      stories={stories}
      allImages={allImages}
      storyGroups={STORY_GROUPS}
      containerRefs={containerRefs}
    />
  )
}
