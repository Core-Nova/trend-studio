import { Link } from 'react-router-dom'
import { SectionHeader } from '../atoms/SectionHeader'
import { StoriesHighlights } from '../Stories/StoriesHighlights'
import { StoriesViewer } from '../Stories/StoriesViewer'

export const GalleryView = ({
  sectionTag, title, instructions, followText, instagramUrl, instagramHandle,
  showSeeAll, seeAllBtn, isMobile, stories, allImages, storyGroups, containerRefs
}) => (
  <section id="gallery" className="gallery-section">
    <div className="gallery-header">
      <SectionHeader tag={sectionTag} title={title} />
    </div>
    {!isMobile && <p className="slider-instructions">{instructions}</p>}
    {!isMobile && (
      <div className="gallery-sliders-container">
        {containerRefs.map((ref, i) => (
          <div key={i} className="gallery-slider-item">
            <div ref={ref} className="gallery-three-container"></div>
          </div>
        ))}
      </div>
    )}
    {isMobile && (
      <StoriesHighlights groups={storyGroups} onOpen={stories.open} />
    )}
    <div className="gallery-instagram">
      <p>{followText}</p>
      <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="instagram-link">
        {instagramHandle}
      </a>
    </div>
    {showSeeAll && (
      <div className="section-see-all">
        <Link to="/gallery" className="btn btn-secondary">{seeAllBtn}</Link>
      </div>
    )}
    <StoriesViewer
      images={allImages}
      currentIndex={stories.currentIndex}
      progress={stories.progress}
      onClose={stories.close}
      onNext={stories.next}
      onPrev={stories.prev}
      onPause={stories.pause}
      onResume={stories.resume}
      instagramUrl={instagramUrl}
      instagramHandle={instagramHandle}
    />
  </section>
)
