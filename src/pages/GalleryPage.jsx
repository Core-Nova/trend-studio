import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { usePageSEO } from '../hooks/usePageSEO'
import { imageData } from '../data/imageImports'

const allImages = [...imageData.hero_left, ...imageData.hero_right, ...imageData.gallery]

export const GalleryPage = () => {
  const { t } = useLanguage()

  usePageSEO({
    title: t(translations.seo.galleryTitle),
    description: t(translations.seo.galleryDescription)
  })

  return (
    <div className="page-content">
      <div className="gallery-section gallery-section--page">
        <div className="gallery-header">
          <span className="section-tag">{t(translations.gallery.sectionTag)}</span>
          <h2 className="section-title">{t(translations.gallery.title)}</h2>
          <div className="ornament"></div>
        </div>
        <div className="page-gallery-grid">
          {allImages.map((url, i) => (
            <div key={i} className="page-gallery-grid__item">
              <img
                src={url}
                alt={`TREND salon work ${i + 1}`}
               
                loading="lazy"
                width="600"
                height="800"
              />
            </div>
          ))}
        </div>
        <div className="gallery-instagram gallery-instagram--page">
          <p>{t(translations.gallery.followText)}</p>
          <a
            href="https://instagram.com/trendbytedi"
            target="_blank"
            rel="noopener noreferrer"
            className="instagram-link"
          >
            @trendbytedi
          </a>
        </div>
      </div>
    </div>
  )
}
